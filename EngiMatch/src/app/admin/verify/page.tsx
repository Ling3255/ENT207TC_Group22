"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

interface Programme {
  id: string;
  programme_name: string;
  slug: string;
  degree_type: string;
  duration_text: string | null;
  intake_term: string | null;
  official_url: string;
  application_deadline_visa: string | null;
  application_deadline_non_visa: string | null;
  human_verified: boolean;
  confidence_score: number | null;
  parser_version: string | null;
  source_last_checked_at: string | null;
  university: { name: string; rank: number | null };
  academic_requirements: {
    min_uk_classification: string | null;
    accepted_backgrounds: string[];
  } | null;
  language_requirements: {
    ielts_overall: string | null;
    toefl_total: number | null;
  } | null;
  prerequisite_modules: Array<{
    canonical_module_name: string;
    display_text: string;
    required: boolean;
  }>;
  compliance: { atas_possible: boolean; atas_rule_text: string | null } | null;
}

type FilterMode = "ALL" | "verified" | "unverified";

const RISK_TAG_MAP: Record<
  string,
  {
    labelEn: string;
    labelZh: string;
    color: string;
    descriptionEn: string;
    descriptionZh: string;
  }
> = {
  missing_deadline: {
    labelEn: "Missing deadline",
    labelZh: "缺少截止日期",
    color: "bg-red-100 text-red-700 border-red-200",
    descriptionEn: "No application deadline is currently stored.",
    descriptionZh: "当前没有录入申请截止日期。",
  },
  ambiguous_background: {
    labelEn: "Background unclear",
    labelZh: "背景不清晰",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    descriptionEn: "Accepted undergraduate backgrounds are not defined.",
    descriptionZh: "未明确可接受的本科背景。",
  },
  module_rule_unclear: {
    labelEn: "Prereqs unclear",
    labelZh: "先修不清晰",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    descriptionEn: "Prerequisite module rules need manual confirmation.",
    descriptionZh: "先修课规则需要人工确认。",
  },
  language_page_external: {
    labelEn: "Language missing",
    labelZh: "语言缺失",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    descriptionEn: "Language requirements still need to be confirmed.",
    descriptionZh: "语言要求还需要进一步确认。",
  },
  atas_uncertain: {
    labelEn: "ATAS check",
    labelZh: "ATAS 核查",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    descriptionEn: "This programme may need ATAS confirmation.",
    descriptionZh: "该专业可能需要确认 ATAS 要求。",
  },
  low_confidence: {
    labelEn: "Low confidence",
    labelZh: "低置信度",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    descriptionEn: "Parser confidence is below 60%.",
    descriptionZh: "解析器置信度低于 60%。",
  },
};

function assessRisks(programme: Programme): string[] {
  const risks: string[] = [];

  if (!programme.application_deadline_visa && !programme.application_deadline_non_visa) {
    risks.push("missing_deadline");
  }
  if (!programme.academic_requirements?.accepted_backgrounds?.length) {
    risks.push("ambiguous_background");
  }
  if (!programme.prerequisite_modules.length) {
    risks.push("module_rule_unclear");
  }
  if (
    !programme.language_requirements?.ielts_overall &&
    !programme.language_requirements?.toefl_total
  ) {
    risks.push("language_page_external");
  }
  if (!programme.compliance?.atas_possible && programme.programme_name.toLowerCase().includes("power")) {
    risks.push("atas_uncertain");
  }
  if ((programme.confidence_score ?? 0) < 60) {
    risks.push("low_confidence");
  }

  return risks;
}

export default function AdminVerifyPage() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

    async function loadProgrammes() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/programmes?isActive=true");
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.error ||
              (isEnglish ? "Failed to load programmes." : "加载专业列表失败。")
          );
        }

        if (!cancelled) {
          setProgrammes(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setProgrammes([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : isEnglish
                ? "Failed to load programmes."
                : "加载专业列表失败。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProgrammes();

    return () => {
      cancelled = true;
    };
  }, [isEnglish]);

  const filtered = useMemo(() => {
    return programmes.filter((programme) => {
      if (filter === "verified") return programme.human_verified;
      if (filter === "unverified") return !programme.human_verified;
      return true;
    });
  }, [filter, programmes]);

  const verifiedCount = useMemo(
    () => programmes.filter((programme) => programme.human_verified).length,
    [programmes]
  );
  const unverifiedCount = programmes.length - verifiedCount;

  async function handleToggleVerified(programme: Programme) {
    setActionLoadingId(programme.id);
    setError("");

    try {
      const response = await fetch("/api/admin/verify/programme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmeId: programme.id,
          human_verified: !programme.human_verified,
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error ||
            (isEnglish
              ? "Failed to update verification status."
              : "更新审核状态失败。")
        );
      }

      const updatedProgramme = payload?.data?.programme;
      if (updatedProgramme?.id) {
        setProgrammes((previous) =>
          previous.map((item) => (item.id === updatedProgramme.id ? updatedProgramme : item))
        );
      }
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : isEnglish
            ? "Failed to update verification status."
            : "更新审核状态失败。"
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 px-4 py-8 text-white">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-block text-sm text-slate-400 hover:text-white"
            >
              {isEnglish ? "Back to workspace" : "返回后台工作台"}
            </Link>
            <h1 className="text-3xl font-bold">
              {isEnglish ? "Programme Verification Queue" : "专业审核队列"}
            </h1>
            <p className="mt-1 text-slate-400">
              {isEnglish
                ? "Review parser output, inspect risk tags, and mark records as human verified."
                : "复核解析结果、检查风险标签，并将记录标记为人工确认。"}
            </p>
          </div>
          <div className="mt-8 flex items-center gap-2">
            <Link
              href="/profile"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600"
            >
              {isEnglish ? "Profile" : "个人资料"}
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              }}
              className="rounded-lg bg-slate-600 px-4 py-2 text-sm transition-colors hover:bg-slate-500"
            >
              {isEnglish ? "Logout" : "退出登录"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-3 gap-4">
          <MetricCard
            tone="slate"
            value={programmes.length}
            label={isEnglish ? "All programmes" : "全部专业"}
          />
          <MetricCard
            tone="green"
            value={verifiedCount}
            label={isEnglish ? "Verified" : "已确认"}
          />
          <MetricCard
            tone="amber"
            value={unverifiedCount}
            label={isEnglish ? "Needs review" : "待复核"}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["ALL", "unverified", "verified"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === value
                  ? "bg-cyan-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {value === "ALL"
                ? isEnglish
                  ? `All (${programmes.length})`
                  : `全部 (${programmes.length})`
                : value === "unverified"
                  ? isEnglish
                    ? `Needs review (${unverifiedCount})`
                    : `待复核 (${unverifiedCount})`
                  : isEnglish
                    ? `Verified (${verifiedCount})`
                    : `已确认 (${verifiedCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            {isEnglish ? "Loading..." : "正在加载..."}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            {isEnglish ? "No programme records match the current filter." : "当前筛选条件下没有匹配记录。"}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "University / Programme" : "学校 / 专业"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "Academic" : "学术要求"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "Language" : "语言要求"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "Prerequisites" : "先修课程"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "Risk tags" : "风险标签"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "Confidence" : "置信度"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      {isEnglish ? "Actions" : "操作"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((programme) => {
                    const risks = assessRisks(programme);

                    return (
                      <tr
                        key={programme.id}
                        className="border-b border-slate-100 align-top hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {programme.university.name}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {programme.programme_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">
                            {programme.academic_requirements?.min_uk_classification ?? "-"}
                          </span>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {programme.academic_requirements?.accepted_backgrounds?.join(", ") ||
                              (isEnglish ? "Not set" : "未设置")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700">
                            {programme.language_requirements?.ielts_overall
                              ? `IELTS ${programme.language_requirements.ielts_overall}`
                              : programme.language_requirements?.toefl_total
                                ? `TOEFL ${programme.language_requirements.toefl_total}`
                                : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {programme.prerequisite_modules.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {programme.prerequisite_modules.slice(0, 3).map((module) => (
                                <span
                                  key={`${programme.id}-${module.canonical_module_name}`}
                                  className={`rounded px-1.5 py-0.5 text-xs ${
                                    module.required
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {module.display_text}
                                </span>
                              ))}
                              {programme.prerequisite_modules.length > 3 && (
                                <span className="text-xs text-slate-400">
                                  +{programme.prerequisite_modules.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {isEnglish ? "None" : "无"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {risks.map((risk) => {
                              const config = RISK_TAG_MAP[risk];
                              return config ? (
                                <span
                                  key={risk}
                                  title={isEnglish ? config.descriptionEn : config.descriptionZh}
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.color}`}
                                >
                                  {isEnglish ? config.labelEn : config.labelZh}
                                </span>
                              ) : null;
                            })}
                            {programme.human_verified && (
                              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                {isEnglish ? "Verified" : "已确认"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {programme.confidence_score !== null ? (
                            <span
                              className={`text-xs font-medium ${
                                programme.confidence_score >= 70
                                  ? "text-green-700"
                                  : programme.confidence_score >= 40
                                    ? "text-amber-700"
                                    : "text-red-700"
                              }`}
                            >
                              {programme.confidence_score}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/admin/programmes/${programme.id}`}
                              className="whitespace-nowrap text-xs text-indigo-600 hover:underline"
                            >
                              {isEnglish ? "Edit" : "编辑"}
                            </Link>
                            {programme.official_url && (
                              <a
                                href={programme.official_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whitespace-nowrap text-xs text-slate-500 hover:underline"
                              >
                                {isEnglish ? "Official site" : "官网"}
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={actionLoadingId === programme.id}
                              onClick={() => handleToggleVerified(programme)}
                              className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                                programme.human_verified
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {actionLoadingId === programme.id
                                ? isEnglish
                                  ? "Saving..."
                                  : "保存中..."
                                : programme.human_verified
                                  ? isEnglish
                                    ? "Mark unverified"
                                    : "标记为未确认"
                                  : isEnglish
                                    ? "Mark verified"
                                    : "标记为已确认"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "slate" | "green" | "amber";
}) {
  const toneMap = {
    slate: "border-slate-200 bg-white text-slate-700",
    green: "border-green-200 bg-green-50 text-green-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-xl border p-4 text-center ${toneMap[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}
