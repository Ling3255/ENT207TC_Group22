"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";

type SessionUser = {
  role: "SUPER_ADMIN" | "STAFF" | "STUDENT" | string;
  email: string;
};

type PortalCard = {
  href: string;
  icon: string;
  title: string;
  description: string;
  accent: "ink" | "brass" | "mist";
  span?: string;
};

const roleMeta = {
  SUPER_ADMIN: {
    icon: "Control",
    badgeEn: "Unified Portal",
    badgeZh: "统一入口",
    titleEn: "Manage approvals, data, and operations from one portal",
    titleZh: "在一个统一入口中管理审批、数据和运营流程",
    introEn:
      "The old admin dashboard has been folded into this launch page so you can jump straight into each workflow.",
    introZh: "原来的管理员工作台已经收进这个入口页，现在可以直接跳到各个实际工作流程。",
    primaryHref: "/admin/users",
  },
  STAFF: {
    icon: "Ops",
    badgeEn: "Unified Portal",
    badgeZh: "统一入口",
    titleEn: "Review records and maintain programme data from one portal",
    titleZh: "在一个统一入口中处理核验任务和项目维护",
    introEn:
      "The old staff workspace is no longer your first stop. Use this page as the single navigation surface after login.",
    introZh: "原来的 staff 工作台不再作为登录后的第一站，这里就是登录后的统一导航界面。",
    primaryHref: "/admin/verify",
  },
  STUDENT: {
    icon: "Studio",
    badgeEn: "Unified Portal",
    badgeZh: "统一入口",
    titleEn: "Plan your UK engineering application from one portal",
    titleZh: "在一个统一入口中推进你的英国工程硕士申请",
    introEn:
      "Start from one clear page, then move into profiles, results, resume tools, timeline, and budget planning.",
    introZh: "从一个清晰入口页出发，再进入申请档案、结果、简历工具、时间线和预算规划。",
    primaryHref: "/applicant/dashboard",
  },
} as const;

function getPortalCards(role: SessionUser["role"], locale: "en" | "zh"): PortalCard[] {
  const common = {
    profile: {
      href: "/profile",
      icon: "Profile",
      title: locale === "en" ? "Profile Settings" : "个人设置",
      description:
        locale === "en"
          ? "Update account details and personal preferences."
          : "维护账号资料和个人偏好设置。",
      accent: "mist" as const,
    },
    aiResume: {
      href: "/ai-resume",
      icon: "AI",
      title: locale === "en" ? "AI Resume Studio" : "AI 简历助手",
      description:
        locale === "en"
          ? "Upload, diagnose, optimize, and export your resume."
          : "上传、诊断、优化并导出你的简历。",
      accent: "brass" as const,
      span: "sm:col-span-2",
    },
    timeline: {
      href: "/timeline",
      icon: "Time",
      title: locale === "en" ? "Application Timeline" : "申请时间线",
      description:
        locale === "en"
          ? "Plan what to do next and keep deadlines visible."
          : "规划下一步安排并持续关注关键截止日期。",
      accent: "mist" as const,
    },
  };

  if (role === "SUPER_ADMIN") {
    return [
      {
        href: "/admin/users",
        icon: "Users",
        title: locale === "en" ? "User Approval" : "用户审批",
        description:
          locale === "en"
            ? "Approve staff accounts and control access."
            : "审批工作人员账号并管理访问权限。",
        accent: "ink",
        span: "sm:col-span-2",
      },
      {
        href: "/admin/programmes",
        icon: "Data",
        title: locale === "en" ? "Programme Library" : "项目库",
        description:
          locale === "en"
            ? "Search, review, and maintain programme records."
            : "搜索、审查并维护项目记录。",
        accent: "brass",
      },
      {
        href: "/admin/programmes/new",
        icon: "Create",
        title: locale === "en" ? "Create Programme" : "新建项目",
        description:
          locale === "en"
            ? "Create a new programme and prefill it from source content."
            : "新建项目，并用来源内容辅助预填信息。",
        accent: "mist",
      },
      {
        href: "/admin/verify",
        icon: "Verify",
        title: locale === "en" ? "Verification Queue" : "核验队列",
        description:
          locale === "en"
            ? "Review parsed programme content before release."
            : "在数据正式可信前复核解析结果。",
        accent: "ink",
      },
      common.aiResume,
      common.timeline,
      common.profile,
    ];
  }

  if (role === "STAFF") {
    return [
      {
        href: "/admin/verify",
        icon: "Verify",
        title: locale === "en" ? "Verification Queue" : "核验队列",
        description:
          locale === "en"
            ? "Start with the records that need manual review."
            : "优先处理需要人工复核的记录。",
        accent: "ink",
        span: "sm:col-span-2",
      },
      {
        href: "/admin/programmes",
        icon: "Data",
        title: locale === "en" ? "Programme Library" : "项目库",
        description:
          locale === "en"
            ? "Search and maintain existing programme data."
            : "搜索并维护已有项目数据。",
        accent: "brass",
      },
      {
        href: "/admin/programmes/new",
        icon: "Create",
        title: locale === "en" ? "Create Programme" : "新建项目",
        description:
          locale === "en"
            ? "Add a new programme under an existing university."
            : "在已有学校下新建新的项目记录。",
        accent: "mist",
      },
      common.profile,
    ];
  }

  return [
    {
      href: "/applicant/dashboard",
      icon: "Profiles",
      title: locale === "en" ? "My Profiles" : "我的申请档案",
      description:
        locale === "en"
          ? "Open your saved applicant profiles and continue work."
          : "打开你已保存的申请档案并继续处理。",
      accent: "ink",
      span: "sm:col-span-2",
    },
    {
      href: "/applicant",
      icon: "Create",
      title: locale === "en" ? "Build Profile" : "新建档案",
      description:
        locale === "en"
          ? "Create a new applicant profile for a fresh matching path."
          : "为新的匹配方向建立一份申请档案。",
      accent: "mist",
    },
    common.aiResume,
    {
      href: "/applicant/results",
      icon: "Results",
      title: locale === "en" ? "Match Results" : "匹配结果",
      description:
        locale === "en"
          ? "View programme fit results for an applicant profile."
          : "查看某份申请档案对应的匹配结果。",
      accent: "brass",
    },
    common.timeline,
    {
      href: "/budget",
      icon: "Budget",
      title: locale === "en" ? "Budget Planner" : "预算规划",
      description:
        locale === "en"
          ? "Estimate tuition, living costs, and visa funds."
          : "估算学费、生活费和签证资金需求。",
      accent: "ink",
    },
    common.profile,
  ];
}

function cardClasses(accent: PortalCard["accent"]) {
  switch (accent) {
    case "ink":
      return "border-indigo-900/30 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-700 text-white";
    case "brass":
      return "border-indigo-300 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white";
    default:
      return "border-slate-200 bg-white text-slate-900";
  }
}

export default function HomePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => {
        const session = data.data;
        if (session?.authenticated) {
          setUser(session.user);
        } else {
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

  const roleConfig = user
    ? roleMeta[(user.role as keyof typeof roleMeta) ?? "STUDENT"] ?? roleMeta.STUDENT
    : roleMeta.STUDENT;

  const portalCards = useMemo(
    () => getPortalCards(user?.role ?? "STUDENT", locale === "en" ? "en" : "zh"),
    [locale, user?.role]
  );

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="text-sm tracking-[0.24em] text-slate-400">
          {locale === "en" ? "LOADING" : "加载中"}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-200/20 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 py-3 shadow-[0_20px_50px_rgba(28,36,44,0.06)] backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.32em] text-indigo-600">EngiMatch</div>
            <div className="text-sm text-slate-500">
              {locale === "en" ? "Unified post-login portal" : "登录后统一入口"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="rounded-full border border-indigo-200 px-4 py-2 text-sm text-indigo-600 transition hover:bg-indigo-50"
            >
              {t("home.profile")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              {t("home.logout")}
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-indigo-900/30 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-700 p-6 text-white shadow-[0_30px_80px_rgba(49,46,129,0.22)] sm:p-8">
            <div className="absolute right-[-8%] top-[-12%] h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute bottom-[-10%] right-[12%] h-40 w-40 rounded-full bg-white/5 blur-2xl" />

            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-indigo-100">
                <span>{roleConfig.icon}</span>
                <span>{locale === "en" ? roleConfig.badgeEn : roleConfig.badgeZh}</span>
              </div>
              <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                {locale === "en" ? roleConfig.titleEn : roleConfig.titleZh}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
                {locale === "en" ? roleConfig.introEn : roleConfig.introZh}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={roleConfig.primaryHref}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  {locale === "en" ? "Open my main tool" : "进入主要功能"}
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/15"
                >
                  {locale === "en" ? "Adjust profile settings" : "调整个人设置"}
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(30,37,44,0.07)] backdrop-blur">
              <div className="text-xs uppercase tracking-[0.28em] text-indigo-600">
                {locale === "en" ? "Account" : "当前账号"}
              </div>
              <div className="mt-4 text-2xl font-semibold text-slate-900">{user.email}</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                {locale === "en"
                  ? "Every role now lands on the same portal first, then navigates to feature pages from here."
                  : "现在所有角色登录后都会先进入同一个入口页，再从这里跳转到各个功能页面。"}
              </div>
            </section>

            <section className="rounded-[2rem] border border-indigo-100 bg-indigo-50/70 p-6 shadow-[0_20px_60px_rgba(30,37,44,0.05)]">
              <div className="text-xs uppercase tracking-[0.28em] text-indigo-600">
                {locale === "en" ? "Start here" : "建议使用方式"}
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>
                  {locale === "en"
                    ? "Use the main button for the most important task in your role."
                    : "先用主按钮进入你当前角色最重要的功能。"}
                </li>
                <li>
                  {locale === "en"
                    ? "Use the launch cards below to switch between related workflows."
                    : "再通过下方入口卡片切换到相关的工作流。"}
                </li>
                <li>
                  {locale === "en"
                    ? "Treat this page as the only post-login navigation hub."
                    : "把这个页面当作登录后的唯一导航枢纽。"}
                </li>
              </ul>
            </section>
          </div>
        </div>

        <section className="relative mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-indigo-600">
                {locale === "en" ? "Launch cards" : "功能入口"}
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {locale === "en" ? "Move by workflow, not by dashboards" : "按工作流进入，而不是切换多个工作台"}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {portalCards.map((card) => (
              <Link
                key={`${card.href}-${card.title}`}
                href={card.href}
                className={`${cardClasses(card.accent)} ${
                  card.span ?? ""
                } group relative overflow-hidden rounded-[1.8rem] border p-6 shadow-[0_18px_50px_rgba(28,36,44,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(28,36,44,0.12)]`}
              >
                <div className="absolute right-4 top-4 text-xs uppercase tracking-[0.28em] opacity-70">
                  Launch
                </div>
                <div className="relative">
                  <div className="text-lg font-medium">{card.icon}</div>
                  <div className="mt-10 text-xl font-semibold">{card.title}</div>
                  <p
                    className={`mt-3 max-w-sm text-sm leading-6 ${
                      card.accent === "mist" ? "text-slate-500" : "text-white/82"
                    }`}
                  >
                    {card.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
