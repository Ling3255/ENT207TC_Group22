"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";
import { getAiResumeMajorLabel } from "@/lib/ai-resume-majors";

interface ApplicantCard {
  id: string;
  full_name: string | null;
  undergrad_university: string | null;
  undergrad_major: string | null;
  gpa_numeric: number | null;
  gpa_scale: number | null;
  ielts_overall: number | null;
  toefl_total: number | null;
  created_at: string;
  updated_at: string;
  target_tracks: string[];
  modules: Array<{ module_name_raw: string; grade_text: string | null; credits: number | null }>;
  _count: { evaluations: number };
}

export default function ApplicantDashboard() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<ApplicantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isZh = locale === "zh";

  const formatTrackLabel = (track: string) => {
    const primary = getAiResumeMajorLabel(track, locale);
    const secondary = locale === "en" ? getAiResumeMajorLabel(track, "zh") : getAiResumeMajorLabel(track, "en");
    return `${primary} / ${secondary}`;
  };

  useEffect(() => {
    fetchMyApplicants();
  }, []);

  const fetchMyApplicants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applicants/my");
      const data = await res.json();
      setApplicants(Array.isArray(data.data) ? data.data : []);
    } catch {
      showToast(isZh ? "加载失败" : "Load failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isZh ? "确定删除此档案？相关评估结果也将被删除。" : "Delete this profile? Related evaluations will also be removed.")) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/applicants/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(isZh ? "删除成功" : "Deleted", "success");
        setApplicants((prev) => prev.filter((a) => a.id !== id));
      } else {
        showToast(isZh ? "删除失败" : "Delete failed", "error");
      }
    } catch {
      showToast(isZh ? "网络错误" : "Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (session.data?.user) {
        router.push(`/applicant/results?applicantId=${id}`);
      }
    } catch {
      router.push(`/applicant/results?applicantId=${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-sm text-slate-500 hover:text-slate-800">
            ← {t("nav.home")}
          </Link>
          <div className="text-sm font-medium text-slate-700">
            {isZh ? "我的申请档案" : "My Application Profiles"}
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title + New Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isZh ? "我的申请档案" : "My Application Profiles"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isZh ? "管理多个申请档案，对比不同背景下的匹配结果" : "Manage multiple profiles and compare matching results"}
            </p>
          </div>
          <Link
            href="/applicant"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
          >
            {isZh ? "+ 新建档案" : "+ New Profile"}
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16 text-slate-400">{t("common.loading")}</div>
        )}

        {!loading && applicants.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {isZh ? "还没有档案" : "No profiles yet"}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {isZh ? "创建你的第一个申请档案，开始匹配英国工程硕士项目" : "Create your first profile to start matching UK engineering master's programmes"}
            </p>
            <Link
              href="/applicant"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block"
            >
              {isZh ? "创建档案" : "Create Profile"}
            </Link>
          </div>
        )}

        {!loading && applicants.length > 0 && (
          <div className="space-y-4">
            {applicants.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          {app.full_name || (isZh ? "未命名档案" : "Unnamed Profile")}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {new Date(app.created_at).toLocaleDateString(isZh ? "zh-CN" : "en-US")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {app.undergrad_university || (isZh ? "未填写院校" : "No university")}
                        {app.undergrad_major && ` · ${app.undergrad_major}`}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {app.gpa_numeric && (
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                            GPA {Number(app.gpa_numeric).toFixed(2)}/{Number(app.gpa_scale).toFixed(1)}
                          </span>
                        )}
                        {app.ielts_overall && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                            IELTS {Number(app.ielts_overall).toFixed(1)}
                          </span>
                        )}
                        {app.toefl_total && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                            TOEFL {app.toefl_total}
                          </span>
                        )}
                        {app.target_tracks.length > 0 && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">
                            {app.target_tracks.map((track) => formatTrackLabel(track)).join(", ")}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg">
                          {app.modules.length} {isZh ? "门课程" : "courses"}
                        </span>
                        <span className="px-2 py-1 bg-violet-50 text-violet-600 rounded-lg">
                          {app._count.evaluations} {isZh ? "个匹配结果" : "matches"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleSetActive(app.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        {isZh ? "查看结果" : "View Results"}
                      </button>
                      <Link
                        href={`/applicant?editId=${app.id}`}
                        className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm text-center hover:bg-slate-50 transition-colors"
                      >
                        {isZh ? "编辑" : "Edit"}
                      </Link>
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deletingId === app.id}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === app.id
                          ? (isZh ? "删除中..." : "Deleting...")
                          : (isZh ? "删除" : "Delete")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
