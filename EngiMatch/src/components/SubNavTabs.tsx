"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SubNavItem = { label: string; href: string };

const SUB_NAV_CONFIG: Record<string, SubNavItem[]> = {
  "/ai-resume": [
    { label: "选择方向", href: "/ai-resume" },
    { label: "上传简历", href: "/ai-resume/upload" },
    { label: "查看分块", href: "/ai-resume/review" },
    { label: "AI 诊断", href: "/ai-resume/diagnose" },
    { label: "AI 优化", href: "/ai-resume/optimize" },
    { label: "最终版本", href: "/ai-resume/final" },
  ],
  "/applicant": [
    { label: "仪表盘", href: "/applicant/dashboard" },
    { label: "编辑档案", href: "/applicant" },
    { label: "评估结果", href: "/applicant/results" },
  ],
  "/admin": [
    { label: "工作台", href: "/staff" },
    { label: "总览", href: "/admin" },
    { label: "项目管理", href: "/admin/programmes" },
    { label: "用户管理", href: "/admin/users" },
    { label: "数据验证", href: "/admin/verify" },
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
    // 用户管理仅对 SUPER_ADMIN 显示
    if (item.href === "/admin/users") return userRole === "SUPER_ADMIN";
    return true;
  });

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className="flex gap-1 overflow-x-auto py-2"
          aria-label="Sub navigation"
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
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
