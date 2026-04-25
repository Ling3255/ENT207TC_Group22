"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export default function StaffDashboard() {
  const { t, locale } = useLocale();
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          window.location.href = "/login";
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">{locale === "en" ? "Loading..." : "加载中..."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/home" className="text-sm text-indigo-200 hover:text-white mb-2 inline-block">← {locale === "en" ? "Back to Home" : "返回首页"}</Link>
              <h1 className="text-2xl font-bold">
                {locale === "en" ? "Staff Dashboard" : "工作人员后台"}
              </h1>
              <p className="text-indigo-200 text-sm mt-1">
                {user?.name || user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm transition-colors"
            >
              {locale === "en" ? "Logout" : "退出登录"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-xl font-bold mb-2">
            {locale === "en" ? "Welcome, Staff Member!" : "欢迎，工作人员！"}
          </h2>
          <p className="text-indigo-100">
            {locale === "en"
              ? "Manage programmes, review applications, and help students find their perfect match."
              : "管理项目、审核申请、帮助学生找到最佳匹配。"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/programmes"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-3">📚</div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {locale === "en" ? "Programmes" : "项目列表"}
            </h3>
            <p className="text-sm text-slate-500">
              {locale === "en"
                ? "View, edit, and add UK engineering programmes"
                : "查看、编辑、添加英国工程项目"}
            </p>
          </Link>

          <Link
            href="/admin/verify"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-3">✓</div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {locale === "en" ? "Data Review" : "数据审核"}
            </h3>
            <p className="text-sm text-slate-500">
              {locale === "en"
                ? "Verify parsed data and ensure accuracy"
                : "审核解析数据，确保准确性"}
            </p>
          </Link>

          <Link
            href="/admin/programmes/new"
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-3xl mb-3">➕</div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {locale === "en" ? "Add Programme" : "添加项目"}
            </h3>
            <p className="text-sm text-slate-500">
              {locale === "en"
                ? "Manually add new programmes and requirements"
                : "手动添加新项目和要求"}
            </p>
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">
            {locale === "en" ? "Your Responsibilities" : "您的职责"}
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              {locale === "en"
                ? "Maintain accurate programme information from official university websites"
                : "维护官方大学网站的项目信息准确性"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              {locale === "en"
                ? "Verify AI-parsed data before it goes live"
                : "在数据上线前审核AI解析的数据"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              {locale === "en"
                ? "Monitor student applications and provide support"
                : "监控学生申请并提供支持"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              {locale === "en"
                ? "Update timeline events and deadlines as needed"
                : "根据需要更新时间线事件和截止日期"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
