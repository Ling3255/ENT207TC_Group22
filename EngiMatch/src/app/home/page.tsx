"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/Button";

export default function HomePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          // Not logged in, redirect to login page
          router.push("/");
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setCheckingAuth(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast(locale === "en" ? "Logged out" : "已退出登录", "info");
    window.location.href = "/";
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4">
        <div className="text-slate-400">
          {locale === "en" ? "Loading..." : "加载中..."}
        </div>
      </div>
    );
  }

  if (!user) return null; // Will redirect

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          EngiMatch
        </h1>
        <p className="text-xl text-slate-600 mb-2">{t("home.subtitle")}</p>
        <p className="text-base text-slate-400 mb-8">
          {t("home.description")}
        </p>

        {/* User Info */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 inline-block">
            <p className="text-slate-600 mb-2">
              {user.role === "SUPER_ADMIN"
                ? "🔐 超级管理员"
                : user.role === "STAFF"
                ? "👨‍💼 工作人员"
                : "🎓 学生"}
            </p>
            <p className="text-sm text-slate-500 mb-3">{user.email}</p>
            <div className="flex gap-2 justify-center">
              <Link
                href={
                  user.role === "SUPER_ADMIN"
                    ? "/admin/users"
                    : user.role === "STAFF"
                    ? "/staff"
                    : "/applicant"
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                {t("home.go_dashboard")}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                {t("home.logout")}
              </button>
            </div>
          </div>
        </div>

        <nav
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
          aria-label="Main navigation"
        >
          <Link
            href="/ai-resume"
            className="flex flex-col items-center gap-2 p-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-sm border border-indigo-200 hover:shadow-md transition-all text-white focus:ring-4 focus:ring-indigo-300"
            aria-label={`${t("home.ai_resume")}: ${t("home.ai_resume_desc")}`}
          >
            <div className="text-4xl" aria-hidden="true">
              ✦
            </div>
            <div className="font-semibold">{t("home.ai_resume")}</div>
            <div className="text-sm text-indigo-200 text-center">
              {t("home.ai_resume_desc")}
            </div>
          </Link>
          <Link
            href="/applicant"
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all focus:ring-4 focus:ring-indigo-300"
            aria-label={`${t("home.create_profile")}: ${t("home.create_profile_desc")}`}
          >
            <div className="text-4xl" aria-hidden="true">
              📋
            </div>
            <div className="font-semibold text-slate-900">
              {t("home.create_profile")}
            </div>
            <div className="text-sm text-slate-500">
              {t("home.create_profile_desc")}
            </div>
          </Link>
          <Link
            href="/timeline"
            className="flex flex-col items-center gap-2 p-6 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-sm border border-emerald-200 hover:shadow-md transition-all text-white focus:ring-4 focus:ring-emerald-300"
            aria-label={`${t("home.timeline")}: ${t("home.timeline_desc")}`}
          >
            <div className="text-4xl" aria-hidden="true">
              📅
            </div>
            <div className="font-semibold">{t("home.timeline")}</div>
            <div className="text-sm text-emerald-200 text-center">
              {t("home.timeline_desc")}
            </div>
          </Link>
          <Link
            href="/admin"
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all focus:ring-4 focus:ring-indigo-300"
            aria-label={`${t("home.admin")}: ${t("home.admin_desc")}`}
          >
            <div className="text-4xl" aria-hidden="true">
              ⚙️
            </div>
            <div className="font-semibold text-slate-900">
              {t("home.admin")}
            </div>
            <div className="text-sm text-slate-500">
              {t("home.admin_desc")}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
