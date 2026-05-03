"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "SUPER_ADMIN" | "STAFF" | "STUDENT";
}

interface DashboardStats {
  programmes: number;
  universities: number;
  applicants: number;
}

export default function AdminDashboard() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [user, setUser] = useState<SessionUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    programmes: 0,
    universities: 0,
    applicants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [sessionRes, programmesRes, universitiesRes, applicantsRes] =
          await Promise.all([
            fetch("/api/auth/session"),
            fetch("/api/programmes?isActive=true"),
            fetch("/api/universities"),
            fetch("/api/applicants?pageSize=1"),
          ]);

        const [sessionJson, programmesJson, universitiesJson, applicantsJson] =
          await Promise.all([
            sessionRes.json(),
            programmesRes.json(),
            universitiesRes.json(),
            applicantsRes.json(),
          ]);

        const session = sessionJson?.data;
        if (!session?.authenticated) {
          window.location.href = "/login";
          return;
        }
        if (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "STAFF") {
          if (!cancelled) {
            setError(
              isEnglish
                ? "Insufficient permissions. Staff or admin access required."
                : "权限不足，此页面需要工作人员或管理员权限。"
            );
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setUser(session.user);
          setStats({
            programmes: Array.isArray(programmesJson?.data)
              ? programmesJson.data.length
              : 0,
            universities: Array.isArray(universitiesJson?.data)
              ? universitiesJson.data.length
              : 0,
            applicants:
              typeof applicantsJson?.data?.total === "number"
                ? applicantsJson.data.total
                : 0,
          });
        }
      } catch {
        if (!cancelled) {
          setError(
            isEnglish
              ? "Failed to load the management workspace."
              : "管理后台加载失败。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isEnglish]);

  const quickCards = useMemo(() => {
    const cards = [
      {
        href: "/staff",
        title: isEnglish ? "University setup" : "学校维护",
        description: isEnglish
          ? "Add a new university and keep institution coverage up to date."
          : "新增学校，并维护学校基础信息。",
        accent: "from-cyan-500 to-sky-600",
      },
      {
        href: "/admin/programmes/new",
        title: isEnglish ? "Create programme" : "新建专业",
        description: isEnglish
          ? "Create a programme under an existing university and use one-click recognition."
          : "在已有学校下新建专业，并使用一键识别填入。",
        accent: "from-indigo-500 to-violet-600",
      },
      {
        href: "/admin/programmes",
        title: isEnglish ? "Programme library" : "专业库",
        description: isEnglish
          ? "Review, search, and maintain existing programme records."
          : "搜索、核对并维护现有专业数据。",
        accent: "from-emerald-500 to-teal-600",
      },
      {
        href: "/admin/verify",
        title: isEnglish ? "Verification queue" : "核验队列",
        description: isEnglish
          ? "Review parser output and confirm records before they go live."
          : "复核识别结果，并确认记录后再上线。",
        accent: "from-amber-500 to-orange-500",
      },
    ];

    if (user?.role === "SUPER_ADMIN") {
      cards.unshift({
        href: "/admin/users",
        title: isEnglish ? "User approval" : "用户审批",
        description: isEnglish
          ? "Approve new staff registrations and manage platform accounts."
          : "审批新 staff 注册并管理平台账号。",
        accent: "from-slate-700 to-slate-900",
      });
    }

    return cards;
  }, [isEnglish, user?.role]);

  const workflow = [
    isEnglish
      ? "Step 1: Create the university first if it does not exist yet."
      : "第 1 步：如果学校还不存在，先新增学校。",
    isEnglish
      ? "Step 2: Open the new programme form, choose the university, and paste the official source text or URL."
      : "第 2 步：进入新增专业页面，先选择学校，再粘贴官网原文或官网链接。",
    isEnglish
      ? "Step 3: Use one-click recognition to prefill deadlines, tuition, language, document, and prerequisite fields."
      : "第 3 步：点击一键识别，自动预填截止时间、学费、语言、材料和先修要求。",
    isEnglish
      ? "Step 4: Manually review key fields and save the programme."
      : "第 4 步：人工复核关键字段后保存专业。",
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-500">
          {isEnglish ? "Loading management workspace..." : "正在加载管理后台..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/home"
              className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
            >
              {isEnglish ? "< Back to home" : "< 返回首页"}
            </Link>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
              {user?.role === "SUPER_ADMIN"
                ? isEnglish
                  ? "Admin Workspace"
                  : "超级管理员后台"
                : isEnglish
                  ? "Management Workspace"
                  : "管理工作台"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {isEnglish
                ? "A cleaner backend for school and programme operations"
                : "围绕学校与专业维护重写的管理后台"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">
              {isEnglish
                ? "Staff can add universities, create programmes under them, and prefill fields through one-click recognition. Staff approval remains exclusive to super admins."
                : "staff 可以新增学校、在学校下新建专业，并通过一键识别预填字段；staff 审批仍只属于超级管理员。"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <div className="text-slate-300">
              {isEnglish ? "Signed in as" : "当前登录"}
            </div>
            <div className="font-medium text-white">
              {user?.name || user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title={isEnglish ? "Universities" : "学校数量"}
            value={stats.universities}
            note={
              isEnglish ? "Tracked institutions" : "当前已跟踪学校"
            }
          />
          <StatsCard
            title={isEnglish ? "Programmes" : "专业数量"}
            value={stats.programmes}
            note={isEnglish ? "Active programme records" : "当前有效专业记录"}
          />
          <StatsCard
            title={isEnglish ? "Applicants" : "申请人数量"}
            value={stats.applicants}
            note={isEnglish ? "Student profiles in the system" : "系统中的学生档案"}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-cyan-700">
            {isEnglish ? "Core workflow" : "核心工作流"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {isEnglish
              ? "University first, programme second, recognition before save"
              : "先建学校，再建专业，保存前先识别"}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-sm font-medium text-cyan-700">
              {isEnglish ? "Quick actions" : "快捷入口"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              {isEnglish ? "Use the backend by workflow, not by page hunting" : "按工作流程使用后台，不再四处找页面"}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
              >
                <div
                  className={`inline-flex rounded-2xl bg-gradient-to-br ${card.accent} px-3 py-2 text-sm font-semibold text-white`}
                >
                  {card.title}
                </div>
                <div className="mt-4 text-lg font-semibold text-slate-900">
                  {card.title}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {card.description}
                </p>
                <div className="mt-4 text-sm font-medium text-cyan-700 transition group-hover:text-cyan-900">
                  {isEnglish ? "Open workspace" : "进入工作台"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  note,
}: {
  title: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{note}</div>
    </div>
  );
}
