"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  academic_requirements: { min_uk_classification: string | null; accepted_backgrounds: string[] } | null;
  language_requirements: { ielts_overall: string | null; toefl_total: number | null } | null;
  documents: { transcript_required: boolean; personal_statement_required: boolean } | null;
  compliance: { atas_possible: boolean; atas_rule_text: string | null } | null;
  prerequisite_modules: Array<{ canonical_module_name: string; display_text: string; required: boolean }>;
}

const RISK_TAG_MAP: Record<string, { label: string; color: string; description: string }> = {
  missing_deadline:       { label: "缺失截止日期", color: "bg-red-100 text-red-700 border-red-200", description: "未设置申请截止日期" },
  ambiguous_background:  { label: "专业要求模糊", color: "bg-amber-100 text-amber-700 border-amber-200", description: "未明确列出可接受本科专业" },
  module_rule_unclear:    { label: "先修要求不清", color: "bg-amber-100 text-amber-700 border-amber-200", description: "先修课程要求定义不清晰" },
  language_page_external: { label: "语言要求需确认", color: "bg-amber-100 text-amber-700 border-amber-200", description: "语言要求引用了外部页面" },
  atas_uncertain:         { label: "ATAS待确认", color: "bg-orange-100 text-orange-700 border-orange-200", description: "可能涉及ATAS但未确认" },
  low_confidence:         { label: "置信度低", color: "bg-slate-100 text-slate-600 border-slate-200", description: "解析置信度低于60%" },
};

function assessRisks(p: Programme): string[] {
  const risks: string[] = [];
  if (!p.application_deadline_visa && !p.application_deadline_non_visa) risks.push("missing_deadline");
  if (!p.academic_requirements?.accepted_backgrounds?.length) risks.push("ambiguous_background");
  if (!p.prerequisite_modules.length) risks.push("module_rule_unclear");
  if (!p.language_requirements?.ielts_overall && !p.language_requirements?.toefl_total) risks.push("language_page_external");
  if (!p.compliance?.atas_possible && p.programme_name.toLowerCase().includes("power")) risks.push("atas_uncertain");
  if ((p.confidence_score ?? 0) < 60) risks.push("low_confidence");
  return risks;
}

export default function AdminVerifyPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "verified" | "unverified">("ALL");

  useEffect(() => {
    fetch("/api/programmes?isActive=true")
      .then((r) => r.json())
      .then((data) => { setProgrammes(Array.isArray(data) ? data : []); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = programmes.filter((p) => {
    if (filter === "verified") return p.human_verified;
    if (filter === "unverified") return !p.human_verified;
    return true;
  });

  const verifiedCount = programmes.filter((p) => p.human_verified).length;
  const unverifiedCount = programmes.length - verifiedCount;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <Link href="/admin" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">← 管理后台</Link>
            <h1 className="text-3xl font-bold">项目数据审核</h1>
            <p className="text-slate-400 mt-1">原文对照 · 字段编辑 · 风险标注 · 一键确认</p>
          </div>
          <div className="flex items-center gap-2 mt-8">
            <Link href="/profile" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">个人信息</Link>
            <button
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors"
            >退出登录</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-slate-700">{programmes.length}</div>
            <div className="text-xs text-slate-500">全部项目</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{verifiedCount}</div>
            <div className="text-xs text-green-600">已人工确认</div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{unverifiedCount}</div>
            <div className="text-xs text-amber-600">待审核</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["ALL", "unverified", "verified"] as const).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {f === "ALL" ? `全部 (${programmes.length})` : f === "unverified" ? `待审核 (${unverifiedCount})` : `已确认 (${verifiedCount})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">暂无数据</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">学校 / 项目</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">学位等级</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">英语要求</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">先修课程</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">风险标签</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">置信度</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const risks = assessRisks(p);
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{p.university.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{p.programme_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-700">
                            {p.academic_requirements?.min_uk_classification ?? "—"}
                          </span>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {p.academic_requirements?.accepted_backgrounds?.join(", ") || "未设置"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700">
                            {p.language_requirements?.ielts_overall ? `IELTS ${p.language_requirements.ielts_overall}` : p.language_requirements?.toefl_total ? `TOEFL ${p.language_requirements.toefl_total}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.prerequisite_modules.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.prerequisite_modules.slice(0, 3).map((m) => (
                                <span key={m.canonical_module_name} className={`px-1.5 py-0.5 rounded text-xs ${m.required ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                  {m.display_text}
                                </span>
                              ))}
                              {p.prerequisite_modules.length > 3 && (
                                <span className="text-xs text-slate-400">+{p.prerequisite_modules.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">无</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {risks.map((r) => {
                              const cfg = RISK_TAG_MAP[r];
                              return cfg ? (
                                <span key={r} title={cfg.description} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              ) : null;
                            })}
                            {p.human_verified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                已确认
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.confidence_score !== null ? (
                            <span className={`text-xs font-medium ${p.confidence_score >= 70 ? "text-green-700" : p.confidence_score >= 40 ? "text-amber-700" : "text-red-700"}`}>
                              {p.confidence_score}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/admin/programmes/${p.id}`} className="text-xs text-indigo-600 hover:underline whitespace-nowrap">
                              编辑
                            </Link>
                            {p.official_url && (
                              <a href={p.official_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:underline whitespace-nowrap">
                                官网
                              </a>
                            )}
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