"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ programmes: 0, universities: 0, applicants: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/programmes?isActive=true").then((r) => r.json()),
      fetch("/api/universities").then((r) => r.json()),
      fetch("/api/applicants?pageSize=1").then((r) => r.json()),
    ]).then(([progs, unis, apps]) => {
      setStats({
        programmes: Array.isArray(progs) ? progs.length : 0,
        universities: Array.isArray(unis) ? unis.length : 0,
        applicants: apps.total ?? 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const navCards = [
    { href: "/admin/programmes", icon: "📚", title: "项目列表", desc: "查看、编辑、添加英国工程硕士项目" },
    { href: "/admin/programmes/new", icon: "➕", title: "添加项目", desc: "手动录入新的项目及要求" },
    { href: "/admin/verify", icon: "✓", title: "数据审核", desc: "原文对照 · 风险标签 · 人工确认" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">← 返回首页</Link>
          <h1 className="text-3xl font-bold">管理后台</h1>
          <p className="text-slate-400 mt-1">EngiMatch 英国工程硕士申请评估平台</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
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
              <div className="text-sm text-slate-500 mt-1">项目数量</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-3xl font-bold text-indigo-600">{stats.universities}</div>
              <div className="text-sm text-slate-500 mt-1">大学数量</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-3xl font-bold text-indigo-600">{stats.applicants}</div>
              <div className="text-sm text-slate-500 mt-1">申请者数量</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {navCards.map((card) => (
            <Link key={card.href} href={card.href}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="text-2xl mb-2">{card.icon}</div>
              <h2 className="font-semibold text-slate-900">{card.title}</h2>
              <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-800 mb-2">数据录入流程</h3>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>在「项目列表」中添加新项目，填写基本信息</li>
            <li>在「数据审核」页面粘贴官网爬取的原始文本</li>
            <li>使用「解析」功能自动提取结构化字段</li>
            <li>人工审核并修正字段值，点击「确认」标记为已验证</li>
          </ol>
        </div>
      </div>
    </div>
  );
}