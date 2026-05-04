"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";
import {
  buildTimelineRecommendation,
  getGraduationYearOptions,
  getStudyYearLabel,
  TIMELINE_STUDY_YEAR_OPTIONS,
} from "@/lib/timeline-preferences";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
  applicant_id: string | null;
  timeline_graduation_year: number | null;
  timeline_study_year: number | null;
}

const ROLE_LABELS: Record<string, { zh: string; en: string; icon: string }> = {
  SUPER_ADMIN: { zh: "超级管理员", en: "Super Admin", icon: "🛡" },
  STAFF: { zh: "工作人员", en: "Staff", icon: "🧑‍🏫" },
  STUDENT: { zh: "学生", en: "Student", icon: "🎓" },
};

const STATUS_LABELS: Record<
  string,
  { zh: string; en: string; color: string }
> = {
  PENDING: { zh: "待审批", en: "Pending", color: "text-amber-600" },
  APPROVED: { zh: "已批准", en: "Approved", color: "text-green-600" },
  REJECTED: { zh: "已拒绝", en: "Rejected", color: "text-red-600" },
  SUSPENDED: { zh: "已停用", en: "Suspended", color: "text-slate-600" },
};

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const isZh = locale === "zh";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [name, setName] = useState("");
  const [timelineGraduationYear, setTimelineGraduationYear] = useState("");
  const [timelineStudyYear, setTimelineStudyYear] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data) {
          const profile = payload.data as UserProfile;
          setUser(profile);
          setName(profile.name || "");
          setTimelineGraduationYear(
            profile.timeline_graduation_year
              ? String(profile.timeline_graduation_year)
              : ""
          );
          setTimelineStudyYear(
            profile.timeline_study_year ? String(profile.timeline_study_year) : ""
          );
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const graduationYearOptions = useMemo(
    () => getGraduationYearOptions(),
    []
  );

  const recommendation = useMemo(
    () =>
      buildTimelineRecommendation(
        {
          timeline_graduation_year: timelineGraduationYear
            ? Number(timelineGraduationYear)
            : null,
          timeline_study_year: timelineStudyYear ? Number(timelineStudyYear) : null,
        },
        locale
      ),
    [locale, timelineGraduationYear, timelineStudyYear]
  );

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast(t("auth.password_min"), "error");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          timelineGraduationYear: timelineGraduationYear
            ? Number(timelineGraduationYear)
            : null,
          timelineStudyYear: timelineStudyYear ? Number(timelineStudyYear) : null,
        }),
      });
      const payload = await response.json();

      if (payload.data) {
        setUser((previous) =>
          previous
            ? {
                ...previous,
                name: payload.data.name,
                timeline_graduation_year: payload.data.timeline_graduation_year,
                timeline_study_year: payload.data.timeline_study_year,
              }
            : null
        );
        showToast(isZh ? "个人资料已保存" : "Profile saved", "success");
      } else {
        showToast(payload.error || t("common.error"), "error");
      }
    } catch {
      showToast(t("common.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showToast(t("auth.password_min"), "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t("auth.passwords_not_match"), "error");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json();

      if (payload.data?.message) {
        showToast(payload.data.message, "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
      } else {
        showToast(payload.data?.error || payload.error || t("common.error"), "error");
      }
    } catch {
      showToast(t("common.error"), "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="flex min-h-screen items-center justify-center text-stone-400">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roleConfig = ROLE_LABELS[user.role] || {
    zh: user.role,
    en: user.role,
    icon: "👤",
  };
  const statusConfig = STATUS_LABELS[user.status] || {
    zh: user.status,
    en: user.status,
    color: "text-slate-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/home" className="text-sm text-stone-500 hover:text-stone-800">
            ← {t("nav.home")}
          </Link>
          <div className="text-sm font-medium text-stone-700">{t("profile.title")}</div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">{roleConfig.icon}</div>
          <h1 className="text-2xl font-bold text-stone-900">{t("profile.title")}</h1>
          <p className="mt-1 text-sm text-stone-500">{user.email}</p>
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 bg-stone-50 px-6 py-4">
            <h2 className="font-semibold text-stone-800">{t("profile.basic_info")}</h2>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-stone-500"
              />
              <p className="mt-1 text-xs text-stone-400">{t("profile.email_readonly")}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t("auth.name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={isZh ? "你的姓名" : "Your name"}
              />
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="mb-3">
                <h3 className="font-medium text-stone-900">
                  {isZh ? "年级与时间线设置" : "Year & Timeline Settings"}
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {isZh
                    ? "当前大学年级会记录在个人信息中，申请时间线会先读取这里的年级再展示。"
                    : "Your current university year is stored in your profile and used before the timeline is shown."}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    {isZh ? "当前大学年级" : "Current University Year"}
                  </label>
                  <select
                    value={timelineStudyYear}
                    onChange={(event) => setTimelineStudyYear(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{isZh ? "未选择" : "Not selected"}</option>
                    {TIMELINE_STUDY_YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>
                        {getStudyYearLabel(year, locale)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    {isZh ? "预计毕业年份" : "Expected Graduation Year"}
                  </label>
                  <select
                    value={timelineGraduationYear}
                    onChange={(event) => setTimelineGraduationYear(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{isZh ? "选填" : "Optional"}</option>
                    {graduationYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-stone-600">
                <div className="font-medium text-stone-800">{recommendation.title}</div>
                <div className="mt-1">{recommendation.description}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {t("profile.role")}
                </label>
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700">
                  {roleConfig.icon} {isZh ? roleConfig.zh : roleConfig.en}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {t("profile.status")}
                </label>
                <div
                  className={`rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium ${statusConfig.color}`}
                >
                  {isZh ? statusConfig.zh : statusConfig.en}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-2">
              <div className="flex justify-between text-sm text-stone-500">
                <span>{t("profile.registered")}</span>
                <span>
                  {new Date(user.created_at).toLocaleString(isZh ? "zh-CN" : "en-US")}
                </span>
              </div>
              {user.last_login_at && (
                <div className="mt-1 flex justify-between text-sm text-stone-500">
                  <span>{t("profile.last_login")}</span>
                  <span>
                    {new Date(user.last_login_at).toLocaleString(
                      isZh ? "zh-CN" : "en-US"
                    )}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? t("profile.saving") : t("profile.save_changes")}
            </button>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
            <h2 className="font-semibold text-stone-800">{t("profile.change_password")}</h2>
            <button
              onClick={() => setShowPasswordForm((previous) => !previous)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {showPasswordForm ? t("profile.collapse") : t("profile.change")}
            </button>
          </div>

          {showPasswordForm && (
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {t("profile.current_password")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {t("profile.new_password")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-stone-400">{t("auth.at_least_6_chars")}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  {t("profile.confirm_password")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full rounded-xl bg-stone-800 py-2.5 font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
              >
                {changingPassword ? t("profile.changing") : t("profile.confirm_change")}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full rounded-xl border border-red-200 bg-red-50 py-3 font-medium text-red-600 transition-colors hover:bg-red-100"
        >
          {t("auth.logout")}
        </button>
      </div>
    </div>
  );
}
