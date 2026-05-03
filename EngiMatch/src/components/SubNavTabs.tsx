"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";

type SubNavItem = { labelZh: string; labelEn: string; href: string };

const SUB_NAV_CONFIG: Record<string, SubNavItem[]> = {
  "/ai-resume": [
    { labelZh: "选择方向", labelEn: "Select Direction", href: "/ai-resume" },
    { labelZh: "上传简历", labelEn: "Upload Resume", href: "/ai-resume/upload" },
    { labelZh: "查看分块", labelEn: "Review Sections", href: "/ai-resume/review" },
    { labelZh: "AI 诊断", labelEn: "AI Diagnose", href: "/ai-resume/diagnose" },
    { labelZh: "AI 优化", labelEn: "AI Optimize", href: "/ai-resume/optimize" },
    { labelZh: "最终版本", labelEn: "Final Version", href: "/ai-resume/final" },
  ],
  "/applicant": [
    { labelZh: "仪表盘", labelEn: "Dashboard", href: "/applicant/dashboard" },
    { labelZh: "编辑档案", labelEn: "Edit Profile", href: "/applicant" },
    { labelZh: "评估结果", labelEn: "Results", href: "/applicant/results" },
  ],
  "/admin": [
    { labelZh: "工作台", labelEn: "Workspace", href: "/staff" },
    { labelZh: "总览", labelEn: "Overview", href: "/admin" },
    { labelZh: "项目管理", labelEn: "Programmes", href: "/admin/programmes" },
    { labelZh: "用户管理", labelEn: "Users", href: "/admin/users" },
    { labelZh: "数据验证", labelEn: "Verification", href: "/admin/verify" },
  ],
};

function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === href || pathname === href + "/") return true;
  if (href !== "/" && pathname.startsWith(href + "/")) {
    const hrefDepth = href.split("/").filter(Boolean).length;
    if (hrefDepth === 1) return false;
    return true;
  }
  return false;
}

export default function SubNavTabs() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isEnglish = locale === "en";
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.authenticated) {
          setUserRole(data.data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  let topLevel = Object.keys(SUB_NAV_CONFIG)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(route + "/"));

  // /staff 也使用 /admin 的 tab 配置
  if (!topLevel && (pathname === "/staff" || pathname.startsWith("/staff/"))) {
    topLevel = "/admin";
  }

  if (!topLevel) return null;

  const items = SUB_NAV_CONFIG[topLevel].filter((item) => {
    if (item.href === "/admin/users") return userRole === "SUPER_ADMIN";
    return true;
  });

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className="flex gap-1 overflow-x-auto py-2"
          aria-label={isEnglish ? "Sub navigation" : "子导航"}
        >
          {items.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {isEnglish ? item.labelEn : item.labelZh}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
