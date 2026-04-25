"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export default function AdminDashboard() {
  const { t, locale } = useLocale();
  const [stats, setStats] = useState({ programmes: 0, universities: 0, applicants: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/programmes?isActive=true").then((r) => r.json()).catch(() => []),
      fetch("/api/universities").then((r) => r.json()).catch(() => []),
      fetch("/api/applicants?pageSize=1").then((r) => r.json()).catch(() => ({ total: 0 })),
    ]).then(([progs, unis, apps]) => {
      setStats({
        programmes: Array.isArray(progs) ? progs.length : 0,
        universities: Array.isArray(unis) ? unis.length : 0,
        applicants: apps.total ?? 0,
      });
      setError(null);
    }).catch((err) => {
      console.error("Failed to load admin stats:", err);
      setError(locale === "en" ? "Failed to load statistics. Please refresh the page." : "加载统计数据失败，请刷新页面。");
    }).finally(() => setLoading(false));
  }, [locale]);

  const navCards = [
    { href: "/admin/programmes", icon: "📚", title: locale === "en" ? "Programmes" : "项目列表", desc: locale === "en" ? "View, edit, add UK engineering master's programmes" : "查看、编辑、添加英国工程硕士项目" },
    { href: "/admin/programmes/new", icon: "➕", title: locale === "en" ? "Add Programme" : "添加项目", desc: locale === "en" ? "Manually add new programme and requirements" : "手动录入新的项目及要求" },
    { href: "/admin/verify", icon: "✓", title: locale === "en" ? "Data Review" : "数据审核", desc: locale === "en" ? "Original text comparison · Risk labels · Manual confirmation" : "原文对照 · 风险标签 · 人工确认" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/home" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">← {locale === "en" ? "Back to Home" : "返回首页"}</Link>
          <h1 className="text-3xl font-bold">{locale === "en" ? "Admin Dashboard" : "管理后台"}</h1>
          <p className="text-slate-400 mt-1">{locale === "en" ? "EngiMatch UK Engineering Master's Evaluation Platform" : "EngiMatch 英国工程硕士申请评估平台"}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium">{error}</div>
              <button onClick={() => window.location.reload()} className="text-sm underline hover:no-underline mt-1">
                {locale === "en" ? "Click to refresh" : "点击刷新"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-3xl font-bold text-indigo-600">{stats.programmes}</div>
              <div className="text-sm text-slate-500 mt-1">{locale === "en" ? "Programmes" : "项目数量"}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-3xl font-bold text-indigo-600">{stats.universities}</div>
              <div className="text-sm text-slate-500 mt-1">{locale === "en" ? "Universities" : "大学数量"}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-3xl font-bold text-indigo-600">{stats.applicants}</div>
              <div className="text-sm text-slate-500 mt-1">{locale === "en" ? "Applicants" : "申请者数量"}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {navCards.map((card) => (
            <Link key={card.href} href={card.href}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={card.title}>
              <div className="text-2xl mb-2">{card.icon}</div>
              <h2 className="font-semibold text-slate-900">{card.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-800 mb-2">{locale === "en" ? "Data Entry Workflow" : "数据录入流程"}</h3>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>{locale === "en" ? "Add new programme in「Programmes」, fill in basic info" : "在「项目列表」中添加新项目，填写基本信息"}</li>
            <li>{locale === "en" ? "Paste raw text from official websites in「Data Review」" : "在「数据审核」页面粘贴官网爬取的原始文本"}</li>
            <li>{locale === "en" ? "Use「Parse」to automatically extract structured fields" : "使用「解析」功能自动提取结构化字段"}</li>
            <li>{locale === "en" ? "Review and correct values, click「Confirm」to mark as verified" : "人工审核并修正字段值，点击「确认」标记为已验证"}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}