"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { CANONICAL_MAJORS, CANONICAL_MODULES } from "@/lib/taxonomy";

interface University {
  id: string;
  name: string;
  rank: number | null;
  official_domain: string;
}

interface PreModule {
  canonical_module_name: string;
  display_text: string;
  min_grade_rule: string;
  required: boolean;
}

interface ParseDraftResponse {
  success: boolean;
  cleanedText?: string;
  sourcePageTitle?: string;
  draft?: {
    source_page_title: string | null;
    parser_version: string;
    confidence_score: number;
    tuition_fee_overseas_gbp: number | null;
    application_deadline_visa: string | null;
    application_deadline_non_visa: string | null;
    academic_requirements: {
      min_degree_level: string;
      min_uk_classification: string | null;
      accepted_backgrounds: string[];
      disallowed_backgrounds: string[];
      prerequisite_module_logic: string;
      work_experience_considered: boolean;
      interview_possible: boolean;
      cv_required: boolean;
      portfolio_required: boolean;
    };
    language_requirements: {
      english_requirement_level: string | null;
      ielts_overall: number | null;
      ielts_lrw_min: number | null;
      toefl_total: number | null;
      pte_total: number | null;
      duolingo_total: number | null;
      validity_window_months: number | null;
    };
    documents: {
      transcript_required: boolean;
      personal_statement_required: boolean;
      references_required_count: number | null;
      reference_type_academic_min: number | null;
      cv_resume_required: boolean;
      additional_documents: string[];
    };
    compliance: {
      atas_possible: boolean;
      atas_rule_text: string | null;
      graduate_route_note: string | null;
      visa_deadline_note: string | null;
    };
    prerequisite_modules: Array<{
      canonical_module_name: string;
      display_text: string;
      min_grade_rule: string | null;
      required: boolean;
    }>;
  };
  error?: string;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function NewProgrammePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    source_page_title: "",
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
  const [recognitionMeta, setRecognitionMeta] = useState({
    parserVersion: "",
    confidenceScore: 0,
    lastAction: "",
  });

  const returnTo = useMemo(() => {
    const value = searchParams.get("returnTo");
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return null;
    }
    return value;
  }, [searchParams]);

  const currentPageHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const backTarget = returnTo ?? "/admin";
  const saveTarget = returnTo ?? "/admin/programmes";
  const staffWorkspaceHref = `/staff?returnTo=${encodeURIComponent(currentPageHref)}`;

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
    let cancelled = false;

    async function loadUniversities() {
      setLoadingUniversities(true);
      try {
        const response = await fetch("/api/universities");
        const payload = await response.json();
        if (!cancelled) {
          setUniversities(Array.isArray(payload?.data) ? payload.data : []);
        }
      } finally {
        if (!cancelled) {
          setLoadingUniversities(false);
        }
      }
    }

    loadUniversities();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedUniversity = useMemo(
    () => universities.find((university) => university.id === form.university_id) ?? null,
    [form.university_id, universities]
  );

  const handleFormField =
    (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((previous) => {
        const next = { ...previous, [field]: value };
        if (field === "programme_name" && !previous.slug) {
          next.slug = slugify(value);
        }
        return next;
      });
    };

  const toggleBackground = (major: string) => {
    setAcademicReq((previous) => ({
      ...previous,
      accepted_backgrounds: previous.accepted_backgrounds.includes(major)
        ? previous.accepted_backgrounds.filter((item) => item !== major)
        : [...previous.accepted_backgrounds, major],
    }));
  };

  const addPrereq = () => {
    setPrereqModules((previous) => [
      ...previous,
      {
        canonical_module_name: "",
        display_text: "",
        min_grade_rule: "",
        required: true,
      },
    ]);
  };

  const updatePrereq =
    (index: number, field: keyof PreModule) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const nextValue =
        field === "required"
          ? String((event.target as HTMLInputElement).checked)
          : event.target.value;

      setPrereqModules((previous) =>
        previous.map((module, moduleIndex) =>
          moduleIndex === index
            ? {
                ...module,
                [field]:
                  field === "required" ? nextValue === "true" : nextValue,
              }
            : module
        )
      );
    };

  const removePrereq = (index: number) => {
    setPrereqModules((previous) =>
      previous.filter((_, moduleIndex) => moduleIndex !== index)
    );
  };

  const applyDraft = (payload: ParseDraftResponse, actionLabel: string) => {
    const draft = payload.draft;
    if (!draft) return;

    setForm((previous) => ({
      ...previous,
      source_page_title: draft.source_page_title ?? previous.source_page_title,
      tuition_fee_overseas_gbp:
        draft.tuition_fee_overseas_gbp !== null
          ? String(draft.tuition_fee_overseas_gbp)
          : previous.tuition_fee_overseas_gbp,
      application_deadline_visa:
        formatDateInput(draft.application_deadline_visa) ||
        previous.application_deadline_visa,
      application_deadline_non_visa:
        formatDateInput(draft.application_deadline_non_visa) ||
        previous.application_deadline_non_visa,
    }));

    setAcademicReq({
      ...academicReq,
      min_degree_level: draft.academic_requirements.min_degree_level || "bachelor",
      min_uk_classification:
        draft.academic_requirements.min_uk_classification ?? "",
      accepted_backgrounds: draft.academic_requirements.accepted_backgrounds ?? [],
      disallowed_backgrounds:
        draft.academic_requirements.disallowed_backgrounds ?? [],
      prerequisite_module_logic:
        draft.academic_requirements.prerequisite_module_logic || "ALL",
    });

    setLangReq({
      english_requirement_level:
        draft.language_requirements.english_requirement_level ?? "",
      ielts_overall:
        draft.language_requirements.ielts_overall !== null
          ? String(draft.language_requirements.ielts_overall)
          : "",
      ielts_lrw_min:
        draft.language_requirements.ielts_lrw_min !== null
          ? String(draft.language_requirements.ielts_lrw_min)
          : "",
      toefl_total:
        draft.language_requirements.toefl_total !== null
          ? String(draft.language_requirements.toefl_total)
          : "",
      pte_total:
        draft.language_requirements.pte_total !== null
          ? String(draft.language_requirements.pte_total)
          : "",
      duolingo_total:
        draft.language_requirements.duolingo_total !== null
          ? String(draft.language_requirements.duolingo_total)
          : "",
      validity_window_months:
        draft.language_requirements.validity_window_months !== null
          ? String(draft.language_requirements.validity_window_months)
          : "24",
    });

    setDocs({
      transcript_required: draft.documents.transcript_required,
      personal_statement_required: draft.documents.personal_statement_required,
      references_required_count:
        draft.documents.references_required_count !== null
          ? String(draft.documents.references_required_count)
          : "",
      reference_type_academic_min:
        draft.documents.reference_type_academic_min !== null
          ? String(draft.documents.reference_type_academic_min)
          : "",
      cv_resume_required: draft.documents.cv_resume_required,
      additional_documents: draft.documents.additional_documents ?? [],
    });

    setCompliance({
      atas_possible: draft.compliance.atas_possible,
      atas_rule_text: draft.compliance.atas_rule_text ?? "",
      graduate_route_note: draft.compliance.graduate_route_note ?? "",
      visa_deadline_note: draft.compliance.visa_deadline_note ?? "",
    });

    setPrereqModules(
      draft.prerequisite_modules.map((module) => ({
        canonical_module_name: module.canonical_module_name,
        display_text: module.display_text,
        min_grade_rule: module.min_grade_rule ?? "",
        required: module.required,
      }))
    );

    setRecognitionMeta({
      parserVersion: draft.parser_version,
      confidenceScore: draft.confidence_score,
      lastAction: actionLabel,
    });

    if (payload.cleanedText) {
      setRawRequirementText(payload.cleanedText);
    }
  };

  const handleRecognize = async () => {
    if (!rawRequirementText.trim()) {
      setError(
        isEnglish
          ? "Paste the official source text first, or fetch it from the URL."
          : "请先粘贴官网原文，或者先从链接抓取内容。"
      );
      return;
    }

    setError("");
    setSuccessMessage("");
    setRecognizing(true);

    try {
      const response = await fetch("/api/admin/parse/programme-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawRequirementText,
          sourcePageTitle: form.source_page_title,
          treatAsHtml: /<[^>]+>/.test(rawRequirementText),
        }),
      });

      const payload = (await response.json()) as ParseDraftResponse;
      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error ||
            (isEnglish ? "Recognition failed." : "自动识别失败。")
        );
      }

      applyDraft(
        payload,
        isEnglish ? "Recognized from pasted source text" : "已根据原文完成识别"
      );
      setSuccessMessage(
        isEnglish
          ? "Recognition complete. Please review the prefilled fields before saving."
          : "一键识别完成，请在保存前复核自动填入的字段。"
      );
    } catch (recognitionError) {
      setError(
        recognitionError instanceof Error
          ? recognitionError.message
          : isEnglish
            ? "Recognition failed."
            : "自动识别失败。"
      );
    } finally {
      setRecognizing(false);
    }
  };

  const handleFetchAndRecognize = async () => {
    if (!form.official_url.trim()) {
      setError(isEnglish ? "Enter the official programme URL first." : "请先填写专业官网链接。");
      return;
    }

    setError("");
    setSuccessMessage("");
    setCrawling(true);

    try {
      const crawlRes = await fetch("/api/admin/crawl/programme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.official_url }),
      });
      const crawlPayload = await crawlRes.json();
      if (!crawlRes.ok || !crawlPayload?.success) {
        throw new Error(
          crawlPayload?.error ||
            (isEnglish ? "Failed to fetch the official page." : "抓取官网内容失败。")
        );
      }

      const rawHtml = String(crawlPayload?.data?.rawHtml ?? "");
      const title = String(crawlPayload?.data?.title ?? "");
      setRawRequirementText(rawHtml);
      if (title) {
        setForm((previous) => ({
          ...previous,
          source_page_title: title,
        }));
      }

      const parseRes = await fetch("/api/admin/parse/programme-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawHtml,
          sourcePageTitle: title,
          treatAsHtml: true,
        }),
      });
      const parsePayload = (await parseRes.json()) as ParseDraftResponse;
      if (!parseRes.ok || !parsePayload.success) {
        throw new Error(
          parsePayload.error ||
            (isEnglish ? "Recognition failed after fetching the page." : "抓取成功，但识别失败。")
        );
      }

      applyDraft(
        parsePayload,
        isEnglish
          ? "Fetched from official URL and recognized"
          : "已抓取官网并完成识别"
      );
      setSuccessMessage(
        isEnglish
          ? "Official page fetched and recognised. Review the prefilled fields before saving."
          : "官网内容已抓取并识别，请复核自动填入的字段后保存。"
      );
    } catch (crawlError) {
      setError(
        crawlError instanceof Error
          ? crawlError.message
          : isEnglish
            ? "Failed to fetch or recognise the official page."
            : "抓取或识别官网内容失败。"
      );
    } finally {
      setCrawling(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccessMessage("");

    if (!form.university_id || !form.programme_name || !form.slug || !form.official_url) {
      setError(
        isEnglish
          ? "University, programme name, slug, and official URL are required."
          : "学校、专业名称、slug 和官网链接为必填项。"
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tuition_fee_overseas_gbp: form.tuition_fee_overseas_gbp
            ? parseFloat(form.tuition_fee_overseas_gbp)
            : null,
          application_deadline_visa: form.application_deadline_visa || null,
          application_deadline_non_visa: form.application_deadline_non_visa || null,
          source_last_checked_at: new Date().toISOString(),
          raw_requirement_text: rawRequirementText || null,
          parser_version: recognitionMeta.parserVersion || null,
          confidence_score: recognitionMeta.confidenceScore || null,
          human_verified: false,
          academic_requirements: academicReq,
          language_requirements: {
            ...langReq,
            ielts_overall: langReq.ielts_overall ? parseFloat(langReq.ielts_overall) : null,
            ielts_lrw_min: langReq.ielts_lrw_min ? parseFloat(langReq.ielts_lrw_min) : null,
            toefl_total: langReq.toefl_total ? parseInt(langReq.toefl_total, 10) : null,
            pte_total: langReq.pte_total ? parseInt(langReq.pte_total, 10) : null,
            duolingo_total: langReq.duolingo_total ? parseInt(langReq.duolingo_total, 10) : null,
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
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error ||
            (isEnglish ? "Failed to create the programme." : "创建专业失败。")
        );
      }

      router.push(saveTarget);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : isEnglish
            ? "Failed to create the programme."
            : "创建专业失败。"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingUniversities) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-500">
          {isEnglish ? "Loading universities..." : "正在加载学校列表..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Link
            href={backTarget}
            className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
          >
            {isEnglish ? "< Back to workspace" : "< 返回后台工作台"}
          </Link>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            {isEnglish ? "New Programme" : "新建专业"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {isEnglish
              ? "Create a programme under a university"
              : "在已有学校下创建新专业"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            {isEnglish
              ? "Choose the university, fetch or paste the official source content, run one-click recognition, and then review the prefilled fields."
              : "先选择学校，再抓取或粘贴官网原文，运行一键识别，最后复核自动填入的字段。"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Step 1" : "第 1 步"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {isEnglish ? "Choose the university" : "选择所属学校"}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "University" : "学校"}
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    value={form.university_id}
                    onChange={handleFormField("university_id")}
                  >
                    <option value="">
                      {isEnglish ? "Select a university" : "请选择学校"}
                    </option>
                    {universities.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                        {university.rank ? ` (Rank ${university.rank})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "Programme name" : "专业名称"}
                  </label>
                  <input
                    value={form.programme_name}
                    onChange={handleFormField("programme_name")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder={isEnglish ? "MSc Power Systems Engineering" : "例如：MSc Power Systems Engineering"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={handleFormField("slug")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="power-systems-engineering-msc"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "Degree type" : "学位类型"}
                  </label>
                  <select
                    value={form.degree_type}
                    onChange={handleFormField("degree_type")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="MSc">MSc</option>
                    <option value="MEng">MEng</option>
                    <option value="MRes">MRes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "Department" : "院系"}
                  </label>
                  <input
                    value={form.department}
                    onChange={handleFormField("department")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {selectedUniversity ? (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    {selectedUniversity.name}
                  </div>
                  <div className="mt-1 text-xs">
                    {selectedUniversity.official_domain}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500">
                  {isEnglish
                    ? "If the university is missing, create it first in the staff workspace."
                    : "如果学校还不存在，请先到 staff 工作台新增学校。"}
                  <Link
                    href={staffWorkspaceHref}
                    className="ml-2 font-medium text-cyan-700 hover:text-cyan-900"
                  >
                    {isEnglish ? "Open staff workspace" : "前往 staff 工作台"}
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Step 2" : "第 2 步"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {isEnglish
                  ? "Source content and one-click recognition"
                  : "来源内容与一键识别"}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "Official programme URL" : "专业官网链接"}
                  </label>
                  <input
                    type="url"
                    value={form.official_url}
                    onChange={handleFormField("official_url")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder="https://www.example.ac.uk/programme"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "Source page title" : "来源页面标题"}
                  </label>
                  <input
                    value={form.source_page_title}
                    onChange={handleFormField("source_page_title")}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder={isEnglish ? "Optional, auto-filled after fetching" : "可选，抓取后会自动填写"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {isEnglish ? "Official source text or HTML" : "官网原文或页面 HTML"}
                  </label>
                  <textarea
                    rows={12}
                    value={rawRequirementText}
                    onChange={(event) => setRawRequirementText(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    placeholder={
                      isEnglish
                        ? "Paste the official entry requirements, language requirements, fees, and deadlines here..."
                        : "请粘贴官网中的申请要求、语言要求、学费、截止日期等原文..."
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleFetchAndRecognize}
                    disabled={crawling}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {crawling
                      ? isEnglish
                        ? "Fetching and recognising..."
                        : "抓取并识别中..."
                      : isEnglish
                        ? "Fetch from URL and recognise"
                        : "从链接抓取并识别"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRecognize}
                    disabled={recognizing}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {recognizing
                      ? isEnglish
                        ? "Recognising..."
                        : "识别中..."
                      : isEnglish
                        ? "Recognise current source text"
                        : "识别当前原文"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Step 3" : "第 3 步"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {isEnglish ? "Review and save" : "复核并保存"}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                  label={isEnglish ? "Study mode" : "学习方式"}
                  value={form.study_mode}
                  onChange={handleFormField("study_mode")}
                />
                <Field
                  label={isEnglish ? "Duration" : "学制"}
                  value={form.duration_text}
                  onChange={handleFormField("duration_text")}
                />
                <Field
                  label={isEnglish ? "Intake term" : "入学季"}
                  value={form.intake_term}
                  onChange={handleFormField("intake_term")}
                />
                <Field
                  label={isEnglish ? "Application system" : "申请系统"}
                  value={form.application_system_type}
                  onChange={handleFormField("application_system_type")}
                />
                <Field
                  label={isEnglish ? "Visa deadline" : "签证类截止日期"}
                  type="date"
                  value={form.application_deadline_visa}
                  onChange={handleFormField("application_deadline_visa")}
                />
                <Field
                  label={isEnglish ? "Non-visa deadline" : "非签证类截止日期"}
                  type="date"
                  value={form.application_deadline_non_visa}
                  onChange={handleFormField("application_deadline_non_visa")}
                />
                <Field
                  label={isEnglish ? "International tuition (GBP)" : "国际学生学费 (GBP)"}
                  type="number"
                  value={form.tuition_fee_overseas_gbp}
                  onChange={handleFormField("tuition_fee_overseas_gbp")}
                />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isEnglish ? "Academic requirements" : "学术要求"}
                  </h3>
                  <div className="mt-3 grid gap-4">
                    <Field
                      label={isEnglish ? "Minimum degree level" : "最低学历"}
                      value={academicReq.min_degree_level}
                      onChange={(event) =>
                        setAcademicReq((previous) => ({
                          ...previous,
                          min_degree_level: event.target.value,
                        }))
                      }
                    />
                    <Field
                      label={isEnglish ? "UK classification" : "英国学位等级"}
                      value={academicReq.min_uk_classification}
                      onChange={(event) =>
                        setAcademicReq((previous) => ({
                          ...previous,
                          min_uk_classification: event.target.value,
                        }))
                      }
                    />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        {isEnglish ? "Accepted backgrounds" : "接受的专业背景"}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CANONICAL_MAJORS.map((major) => (
                          <button
                            key={major}
                            type="button"
                            onClick={() => toggleBackground(major)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              academicReq.accepted_backgrounds.includes(major)
                                ? "bg-cyan-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {major.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isEnglish ? "Language and documents" : "语言与材料"}
                  </h3>
                  <div className="mt-3 grid gap-4">
                    <Field
                      label={isEnglish ? "English level" : "语言等级"}
                      value={langReq.english_requirement_level}
                      onChange={(event) =>
                        setLangReq((previous) => ({
                          ...previous,
                          english_requirement_level: event.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="IELTS"
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
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>
                    <div className="grid gap-3">
                      <Toggle
                        checked={docs.transcript_required}
                        label={isEnglish ? "Transcript required" : "需要成绩单"}
                        onChange={(checked) =>
                          setDocs((previous) => ({
                            ...previous,
                            transcript_required: checked,
                          }))
                        }
                      />
                      <Toggle
                        checked={docs.personal_statement_required}
                        label={isEnglish ? "Personal statement required" : "需要个人陈述"}
                        onChange={(checked) =>
                          setDocs((previous) => ({
                            ...previous,
                            personal_statement_required: checked,
                          }))
                        }
                      />
                      <Toggle
                        checked={docs.cv_resume_required}
                        label={isEnglish ? "CV required" : "需要简历"}
                        onChange={(checked) =>
                          setDocs((previous) => ({
                            ...previous,
                            cv_resume_required: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  {isEnglish ? "Prerequisite modules" : "先修课程"}
                </h3>
                <div className="mt-3 space-y-3">
                  {prereqModules.map((module, index) => (
                    <div
                      key={`${module.canonical_module_name}-${index}`}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_1.4fr_0.8fr_auto_auto]"
                    >
                      <select
                        value={module.canonical_module_name}
                        onChange={updatePrereq(index, "canonical_module_name")}
                        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                      >
                        <option value="">
                          {isEnglish ? "Select module" : "选择模块"}
                        </option>
                        {CANONICAL_MODULES.map((canonicalModule) => (
                          <option key={canonicalModule} value={canonicalModule}>
                            {canonicalModule.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                      <input
                        value={module.display_text}
                        onChange={updatePrereq(index, "display_text")}
                        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        placeholder={isEnglish ? "Display text from source" : "官网中的原始表述"}
                      />
                      <input
                        value={module.min_grade_rule}
                        onChange={updatePrereq(index, "min_grade_rule")}
                        className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        placeholder={isEnglish ? "Grade rule" : "成绩要求"}
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-600">
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
                  ))}
                  <button
                    type="button"
                    onClick={addPrereq}
                    className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    {isEnglish ? "Add prerequisite module" : "新增先修课程"}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push(saveTarget)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {isEnglish ? "Cancel" : "取消"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? isEnglish
                      ? "Saving..."
                      : "保存中..."
                    : isEnglish
                      ? "Create programme"
                      : "创建专业"}
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Recognition status" : "识别状态"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {isEnglish ? "Current draft" : "当前草稿"}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <InfoRow
                  label={isEnglish ? "Parser version" : "识别版本"}
                  value={recognitionMeta.parserVersion || (isEnglish ? "Not used yet" : "尚未使用")}
                />
                <InfoRow
                  label={isEnglish ? "Confidence" : "置信度"}
                  value={`${recognitionMeta.confidenceScore || 0}%`}
                />
                <InfoRow
                  label={isEnglish ? "Latest action" : "最近动作"}
                  value={recognitionMeta.lastAction || (isEnglish ? "None" : "暂无")}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Staff permissions" : "staff 权限"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {isEnglish ? "What staff can do here" : "staff 在这里能做什么"}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>
                  {isEnglish
                    ? "Create new universities from the staff workspace."
                    : "可以在 staff 工作台新增学校。"}
                </li>
                <li>
                  {isEnglish
                    ? "Create new programmes under an existing university."
                    : "可以在已有学校下新建专业。"}
                </li>
                <li>
                  {isEnglish
                    ? "Use one-click recognition to prefill fields before saving."
                    : "可以在保存前用一键识别自动预填字段。"}
                </li>
                <li>
                  {isEnglish
                    ? "Cannot approve or reject other staff accounts."
                    : "不能审批其他 staff 账号。"}
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function NewProgrammePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProgrammePageInner />
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
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  );
}
