"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { CANONICAL_MAJORS, CANONICAL_MODULES } from "@/lib/taxonomy";

interface PreModule {
  canonical_module_name: string;
  display_text: string;
  min_grade_rule: string;
  required: boolean;
}

interface University {
  id: string;
  name: string;
  rank: number | null;
}

const inputClass =
  "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";
const sectionClass = "rounded-2xl border border-slate-200 bg-white p-5";

function EditProgrammePageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = require("react").use(params);
  const router = useRouter();
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "basic" | "academic" | "language" | "documents" | "compliance" | "prereqs" | "source"
  >("basic");

  const [form, setForm] = useState({
    university_id: "",
    programme_name: "",
    slug: "",
    degree_type: "MSc",
    department: "",
    study_mode: "full-time",
    duration_text: "1 year",
    intake_term: "",
    application_system_type: "university_portal",
    application_deadline_visa: "",
    application_deadline_non_visa: "",
    tuition_fee_overseas_gbp: "",
    official_url: "",
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
    transcript_required: false,
    personal_statement_required: false,
    references_required_count: "",
    reference_type_academic_min: "",
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

  const setField =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const toggleMajor = (major: string) =>
    setAcademicReq((previous) => ({
      ...previous,
      accepted_backgrounds: previous.accepted_backgrounds.includes(major)
        ? previous.accepted_backgrounds.filter((item) => item !== major)
        : [...previous.accepted_backgrounds, major],
    }));

  const addPrereq = () =>
    setPrereqModules((previous) => [
      ...previous,
      { canonical_module_name: "", display_text: "", min_grade_rule: "", required: true },
    ]);

  const updatePrereq =
    (index: number, field: keyof PreModule) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setPrereqModules((previous) =>
        previous.map((module, moduleIndex) =>
          moduleIndex === index
            ? {
                ...module,
                [field]:
                  field === "required"
                    ? String((event.target as HTMLInputElement).checked) === "true"
                    : event.target.value,
              }
            : module
        )
      );

  const removePrereq = (index: number) =>
    setPrereqModules((previous) => previous.filter((_, moduleIndex) => moduleIndex !== index));

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      const session = data?.data;
      if (!session?.authenticated) {
        window.location.href = "/login";
        return;
      }
      if (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "STAFF") {
        setError(
          isEnglish
            ? "Insufficient permissions. Staff or admin access required."
            : "权限不足，此页面需要工作人员或管理员权限。"
        );
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/universities").then((response) => response.json()),
      fetch(`/api/programmes/${id}`).then((response) => response.json()),
    ])
      .then(([universitiesPayload, programmePayload]) => {
        const nextUniversities = Array.isArray(universitiesPayload?.data)
          ? universitiesPayload.data
          : [];
        const programme = programmePayload?.data;

        setUniversities(nextUniversities);
        if (!programme?.id) return;

        const formatDate = (value: string | null) =>
          value ? new Date(value).toISOString().slice(0, 10) : "";

        setForm({
          university_id: programme.university_id ?? "",
          programme_name: programme.programme_name ?? "",
          slug: programme.slug ?? "",
          degree_type: programme.degree_type ?? "MSc",
          department: programme.department ?? "",
          study_mode: programme.study_mode ?? "full-time",
          duration_text: programme.duration_text ?? "1 year",
          intake_term: programme.intake_term ?? "",
          application_system_type: programme.application_system_type ?? "university_portal",
          application_deadline_visa: formatDate(programme.application_deadline_visa),
          application_deadline_non_visa: formatDate(programme.application_deadline_non_visa),
          tuition_fee_overseas_gbp: programme.tuition_fee_overseas_gbp
            ? String(programme.tuition_fee_overseas_gbp)
            : "",
          official_url: programme.official_url ?? "",
        });

        if (programme.academic_requirements) {
          setAcademicReq({
            min_degree_level: programme.academic_requirements.min_degree_level ?? "bachelor",
            min_uk_classification:
              programme.academic_requirements.min_uk_classification ?? "",
            accepted_backgrounds: programme.academic_requirements.accepted_backgrounds ?? [],
            disallowed_backgrounds:
              programme.academic_requirements.disallowed_backgrounds ?? [],
            prerequisite_module_logic:
              programme.academic_requirements.prerequisite_module_logic ?? "ALL",
            work_experience_considered:
              programme.academic_requirements.work_experience_considered ?? false,
            interview_possible:
              programme.academic_requirements.interview_possible ?? false,
            cv_required: programme.academic_requirements.cv_required ?? false,
            portfolio_required:
              programme.academic_requirements.portfolio_required ?? false,
          });
        }

        if (programme.language_requirements) {
          setLangReq({
            english_requirement_level:
              programme.language_requirements.english_requirement_level ?? "",
            ielts_overall: programme.language_requirements.ielts_overall
              ? String(programme.language_requirements.ielts_overall)
              : "",
            ielts_lrw_min: programme.language_requirements.ielts_lrw_min
              ? String(programme.language_requirements.ielts_lrw_min)
              : "",
            toefl_total: programme.language_requirements.toefl_total
              ? String(programme.language_requirements.toefl_total)
              : "",
            pte_total: programme.language_requirements.pte_total
              ? String(programme.language_requirements.pte_total)
              : "",
            duolingo_total: programme.language_requirements.duolingo_total
              ? String(programme.language_requirements.duolingo_total)
              : "",
            validity_window_months: String(
              programme.language_requirements.validity_window_months ?? 24
            ),
          });
        }

        if (programme.documents) {
          setDocs({
            transcript_required: programme.documents.transcript_required ?? false,
            personal_statement_required:
              programme.documents.personal_statement_required ?? false,
            references_required_count: programme.documents.references_required_count
              ? String(programme.documents.references_required_count)
              : "",
            reference_type_academic_min: programme.documents.reference_type_academic_min
              ? String(programme.documents.reference_type_academic_min)
              : "",
            cv_resume_required: programme.documents.cv_resume_required ?? false,
            additional_documents: programme.documents.additional_documents ?? [],
          });
        }

        if (programme.compliance) {
          setCompliance({
            atas_possible: programme.compliance.atas_possible ?? false,
            atas_rule_text: programme.compliance.atas_rule_text ?? "",
            graduate_route_note: programme.compliance.graduate_route_note ?? "",
            visa_deadline_note: programme.compliance.visa_deadline_note ?? "",
          });
        }

        if (programme.prerequisite_modules) {
          setPrereqModules(
            programme.prerequisite_modules.map(
              (module: {
                canonical_module_name: string;
                display_text: string;
                min_grade_rule: string | null;
                required: boolean;
              }) => ({
                canonical_module_name: module.canonical_module_name,
                display_text: module.display_text,
                min_grade_rule: module.min_grade_rule ?? "",
                required: module.required ?? true,
              })
            )
          );
        }

        setRawRequirementText(programme.raw_requirement_text ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`/api/programmes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tuition_fee_overseas_gbp: form.tuition_fee_overseas_gbp
            ? parseFloat(form.tuition_fee_overseas_gbp)
            : null,
          application_deadline_visa: form.application_deadline_visa || null,
          application_deadline_non_visa: form.application_deadline_non_visa || null,
          academic_requirements: academicReq,
          language_requirements: {
            ...langReq,
            ielts_overall: langReq.ielts_overall ? parseFloat(langReq.ielts_overall) : null,
            ielts_lrw_min: langReq.ielts_lrw_min ? parseFloat(langReq.ielts_lrw_min) : null,
            toefl_total: langReq.toefl_total ? parseInt(langReq.toefl_total, 10) : null,
            pte_total: langReq.pte_total ? parseInt(langReq.pte_total, 10) : null,
            duolingo_total: langReq.duolingo_total
              ? parseInt(langReq.duolingo_total, 10)
              : null,
            validity_window_months: langReq.validity_window_months
              ? parseInt(langReq.validity_window_months, 10)
              : null,
          },
          documents: {
            ...docs,
            references_required_count: docs.references_required_count
              ? parseInt(docs.references_required_count, 10)
              : null,
            reference_type_academic_min: docs.reference_type_academic_min
              ? parseInt(docs.reference_type_academic_min, 10)
              : null,
          },
          compliance,
          prerequisite_modules: prereqModules.filter(
            (module) => module.canonical_module_name && module.display_text
          ),
          raw_requirement_text: rawRequirementText,
        }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error ||
            (isEnglish ? "Failed to save changes." : "保存修改失败。")
        );
      }

      router.push("/admin/programmes");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : isEnglish
            ? "Failed to save changes."
            : "保存修改失败。"
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "basic", label: isEnglish ? "Basic" : "基本信息" },
    { id: "academic", label: isEnglish ? "Academic" : "学术要求" },
    { id: "language", label: isEnglish ? "Language" : "语言要求" },
    { id: "documents", label: isEnglish ? "Documents" : "材料要求" },
    { id: "compliance", label: isEnglish ? "Compliance" : "合规信息" },
    { id: "prereqs", label: isEnglish ? "Prereqs" : "先修课程" },
    { id: "source", label: isEnglish ? "Source" : "原文来源" },
  ] as const;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        {isEnglish ? "Loading..." : "正在加载..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 py-6 text-white">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            href="/admin/programmes"
            className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
          >
            {isEnglish ? "< Back to programmes" : "< 返回专业列表"}
          </Link>
          <h1 className="text-2xl font-bold">
            {isEnglish ? "Edit programme" : "编辑专业"}: {form.programme_name}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-cyan-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "basic" && (
          <div className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {isEnglish ? "Basic programme information" : "专业基础信息"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {isEnglish ? "University" : "所属学校"}
                </label>
                <select
                  className={inputClass}
                  value={form.university_id}
                  onChange={setField("university_id")}
                >
                  <option value="">{isEnglish ? "Select a university" : "选择学校"}</option>
                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {isEnglish ? "Programme name" : "专业名称"}
                </label>
                <input
                  className={inputClass}
                  value={form.programme_name}
                  onChange={setField("programme_name")}
                />
              </div>
              <Field
                label={isEnglish ? "Slug" : "Slug"}
                value={form.slug}
                onChange={setField("slug")}
              />
              <div>
                <label className={labelClass}>{isEnglish ? "Degree type" : "学位类型"}</label>
                <select
                  className={inputClass}
                  value={form.degree_type}
                  onChange={setField("degree_type")}
                >
                  <option value="MSc">MSc</option>
                  <option value="MEng">MEng</option>
                  <option value="MRes">MRes</option>
                  <option value="MPhil">MPhil</option>
                  <option value="MSt">MSt</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Field
                  label={isEnglish ? "Department" : "院系"}
                  value={form.department}
                  onChange={setField("department")}
                />
              </div>
              <Field
                label={isEnglish ? "Study mode" : "学习方式"}
                value={form.study_mode}
                onChange={setField("study_mode")}
              />
              <Field
                label={isEnglish ? "Duration" : "学制"}
                value={form.duration_text}
                onChange={setField("duration_text")}
              />
              <Field
                label={isEnglish ? "Intake term" : "入学学期"}
                value={form.intake_term}
                onChange={setField("intake_term")}
              />
              <Field
                label={isEnglish ? "Application system" : "申请系统"}
                value={form.application_system_type}
                onChange={setField("application_system_type")}
              />
              <Field
                label={isEnglish ? "Visa deadline" : "签证类截止日期"}
                type="date"
                value={form.application_deadline_visa}
                onChange={setField("application_deadline_visa")}
              />
              <Field
                label={isEnglish ? "Non-visa deadline" : "非签证类截止日期"}
                type="date"
                value={form.application_deadline_non_visa}
                onChange={setField("application_deadline_non_visa")}
              />
              <Field
                label={isEnglish ? "International tuition (GBP)" : "国际学生学费 (GBP)"}
                type="number"
                value={form.tuition_fee_overseas_gbp}
                onChange={setField("tuition_fee_overseas_gbp")}
              />
              <div className="md:col-span-2">
                <Field
                  label={isEnglish ? "Official URL" : "官方链接"}
                  type="url"
                  value={form.official_url}
                  onChange={setField("official_url")}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "academic" && (
          <div className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {isEnglish ? "Academic requirements" : "学术要求"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {isEnglish ? "Minimum degree level" : "最低学历"}
                </label>
                <select
                  className={inputClass}
                  value={academicReq.min_degree_level}
                  onChange={(event) =>
                    setAcademicReq((previous) => ({
                      ...previous,
                      min_degree_level: event.target.value,
                    }))
                  }
                >
                  <option value="bachelor">{isEnglish ? "Bachelor" : "本科"}</option>
                  <option value="master">{isEnglish ? "Master" : "硕士"}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  {isEnglish ? "UK classification" : "英国学位等级"}
                </label>
                <select
                  className={inputClass}
                  value={academicReq.min_uk_classification}
                  onChange={(event) =>
                    setAcademicReq((previous) => ({
                      ...previous,
                      min_uk_classification: event.target.value,
                    }))
                  }
                >
                  <option value="">{isEnglish ? "Not specified" : "未说明"}</option>
                  <option value="first">{isEnglish ? "First" : "一等学位"}</option>
                  <option value="2:1">{isEnglish ? "Upper second (2:1)" : "二等一"}</option>
                  <option value="2:2">{isEnglish ? "Lower second (2:2)" : "二等二"}</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>
                {isEnglish ? "Accepted academic backgrounds" : "可接受本科背景"}
              </label>
              <div className="flex flex-wrap gap-2">
                {CANONICAL_MAJORS.map((major) => (
                  <button
                    key={major}
                    type="button"
                    onClick={() => toggleMajor(major)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      academicReq.accepted_backgrounds.includes(major)
                        ? "border-cyan-600 bg-cyan-600 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {major.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CheckboxRow
                checked={academicReq.work_experience_considered}
                label={isEnglish ? "Work experience considered" : "考虑工作经验"}
                onChange={(checked) =>
                  setAcademicReq((previous) => ({
                    ...previous,
                    work_experience_considered: checked,
                  }))
                }
              />
              <CheckboxRow
                checked={academicReq.interview_possible}
                label={isEnglish ? "Interview possible" : "可能安排面试"}
                onChange={(checked) =>
                  setAcademicReq((previous) => ({
                    ...previous,
                    interview_possible: checked,
                  }))
                }
              />
              <CheckboxRow
                checked={academicReq.cv_required}
                label={isEnglish ? "CV required" : "需要 CV"}
                onChange={(checked) =>
                  setAcademicReq((previous) => ({
                    ...previous,
                    cv_required: checked,
                  }))
                }
              />
              <CheckboxRow
                checked={academicReq.portfolio_required}
                label={isEnglish ? "Portfolio required" : "需要作品集"}
                onChange={(checked) =>
                  setAcademicReq((previous) => ({
                    ...previous,
                    portfolio_required: checked,
                  }))
                }
              />
            </div>
          </div>
        )}

        {activeTab === "language" && (
          <div className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {isEnglish ? "English language requirements" : "语言要求"}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label={isEnglish ? "Requirement level" : "语言等级"}
                value={langReq.english_requirement_level}
                onChange={(event) =>
                  setLangReq((previous) => ({
                    ...previous,
                    english_requirement_level: event.target.value,
                  }))
                }
              />
              <Field
                label={isEnglish ? "IELTS overall" : "雅思总分"}
                type="number"
                step="0.5"
                value={langReq.ielts_overall}
                onChange={(event) =>
                  setLangReq((previous) => ({
                    ...previous,
                    ielts_overall: event.target.value,
                  }))
                }
              />
              <Field
                label={isEnglish ? "IELTS sub-score min" : "雅思小分"}
                type="number"
                step="0.5"
                value={langReq.ielts_lrw_min}
                onChange={(event) =>
                  setLangReq((previous) => ({
                    ...previous,
                    ielts_lrw_min: event.target.value,
                  }))
                }
              />
              <Field
                label="TOEFL"
                type="number"
                value={langReq.toefl_total}
                onChange={(event) =>
                  setLangReq((previous) => ({
                    ...previous,
                    toefl_total: event.target.value,
                  }))
                }
              />
              <Field
                label="PTE"
                type="number"
                value={langReq.pte_total}
                onChange={(event) =>
                  setLangReq((previous) => ({
                    ...previous,
                    pte_total: event.target.value,
                  }))
                }
              />
              <Field
                label="Duolingo"
                type="number"
                value={langReq.duolingo_total}
                onChange={(event) =>
                  setLangReq((previous) => ({
                    ...previous,
                    duolingo_total: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {isEnglish ? "Application documents" : "申请材料"}
            </h2>
            <div className="space-y-3">
              <CheckboxRow
                checked={docs.transcript_required}
                label={isEnglish ? "Transcript required" : "需要成绩单"}
                onChange={(checked) =>
                  setDocs((previous) => ({ ...previous, transcript_required: checked }))
                }
              />
              <CheckboxRow
                checked={docs.personal_statement_required}
                label={isEnglish ? "Personal statement required" : "需要个人陈述"}
                onChange={(checked) =>
                  setDocs((previous) => ({
                    ...previous,
                    personal_statement_required: checked,
                  }))
                }
              />
              <CheckboxRow
                checked={docs.cv_resume_required}
                label={isEnglish ? "CV required" : "需要简历"}
                onChange={(checked) =>
                  setDocs((previous) => ({ ...previous, cv_resume_required: checked }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label={isEnglish ? "Reference count" : "推荐信数量"}
                  type="number"
                  value={docs.references_required_count}
                  onChange={(event) =>
                    setDocs((previous) => ({
                      ...previous,
                      references_required_count: event.target.value,
                    }))
                  }
                />
                <Field
                  label={isEnglish ? "Academic references min" : "学术推荐信最少数量"}
                  type="number"
                  value={docs.reference_type_academic_min}
                  onChange={(event) =>
                    setDocs((previous) => ({
                      ...previous,
                      reference_type_academic_min: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "compliance" && (
          <div className={sectionClass}>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {isEnglish ? "Compliance and visa notes" : "合规与签证信息"}
            </h2>
            <CheckboxRow
              checked={compliance.atas_possible}
              label={isEnglish ? "ATAS may be required" : "可能需要 ATAS"}
              onChange={(checked) =>
                setCompliance((previous) => ({ ...previous, atas_possible: checked }))
              }
            />
            <div className="mt-4 space-y-4">
              {compliance.atas_possible && (
                <TextAreaField
                  label={isEnglish ? "ATAS rule note" : "ATAS 说明"}
                  value={compliance.atas_rule_text}
                  onChange={(event) =>
                    setCompliance((previous) => ({
                      ...previous,
                      atas_rule_text: event.target.value,
                    }))
                  }
                />
              )}
              <TextAreaField
                label={isEnglish ? "Graduate Route note" : "Graduate Route 说明"}
                value={compliance.graduate_route_note}
                onChange={(event) =>
                  setCompliance((previous) => ({
                    ...previous,
                    graduate_route_note: event.target.value,
                  }))
                }
              />
              <TextAreaField
                label={isEnglish ? "Visa deadline note" : "签证截止说明"}
                value={compliance.visa_deadline_note}
                onChange={(event) =>
                  setCompliance((previous) => ({
                    ...previous,
                    visa_deadline_note: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        )}

        {activeTab === "prereqs" && (
          <div className={sectionClass}>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              {isEnglish ? "Prerequisite modules" : "先修课程"}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              {isEnglish
                ? "Choose the canonical module and fill in the source wording."
                : "选择标准模块，并填写官网中的原始表述。"}
            </p>
            {prereqModules.map((module, index) => (
              <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex flex-col gap-2 lg:flex-row">
                  <select
                    className={`${inputClass} lg:w-64`}
                    value={module.canonical_module_name}
                    onChange={updatePrereq(index, "canonical_module_name")}
                  >
                    <option value="">
                      {isEnglish ? "Select canonical module" : "选择标准模块"}
                    </option>
                    {CANONICAL_MODULES.map((canonicalModule) => (
                      <option key={canonicalModule} value={canonicalModule}>
                        {canonicalModule.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder={
                      isEnglish ? "Display text from official source" : "官网原始显示文本"
                    }
                    value={module.display_text}
                    onChange={updatePrereq(index, "display_text")}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={module.required}
                      onChange={(event) =>
                        setPrereqModules((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, required: event.target.checked }
                              : item
                          )
                        )
                      }
                    />
                    {isEnglish ? "Required" : "必修"}
                  </label>
                  <button
                    type="button"
                    onClick={() => removePrereq(index)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50"
                  >
                    {isEnglish ? "Remove" : "删除"}
                  </button>
                </div>
                <input
                  className={inputClass}
                  placeholder={isEnglish ? "Minimum grade rule (optional)" : "最低成绩要求（选填）"}
                  value={module.min_grade_rule}
                  onChange={updatePrereq(index, "min_grade_rule")}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addPrereq}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700"
            >
              {isEnglish ? "+ Add prerequisite module" : "+ 新增先修课程"}
            </button>
          </div>
        )}

        {activeTab === "source" && (
          <div className={sectionClass}>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              {isEnglish ? "Raw source text" : "原始来源文本"}
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              {isEnglish
                ? "Paste or preserve the official source text here for verification."
                : "可在这里保存官网原文，便于后续核对。"}
            </p>
            <textarea
              className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              rows={18}
              value={rawRequirementText}
              onChange={(event) => setRawRequirementText(event.target.value)}
            />
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/programmes")}
            className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {isEnglish ? "Cancel" : "取消"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-cyan-600 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {saving
              ? isEnglish
                ? "Saving..."
                : "保存中..."
              : isEnglish
                ? "Save changes"
                : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditProgrammePage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProgrammePageInner {...props} />
    </Suspense>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={onChange}
        className={inputClass}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
