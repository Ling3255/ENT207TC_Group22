"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";

const SIDEBAR_ROUTES = [
  "/home",
  "/ai-resume",
  "/applicant",
  "/timeline",
  "/budget",
  "/admin",
  "/staff",
  "/profile",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        const session = data.data;
        if (session?.authenticated) {
          setUser(session.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast(locale === "en" ? "Logged out" : "已退出登录", "info");
    window.location.href = "/";
  };

  const showSidebar = SIDEBAR_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  if (!showSidebar) {
    return <>{children}</>;
  }

  const role = user?.role;

  let navItems: { href: string; icon: string; label: string; exact?: boolean }[] = [];

  if (role === "STAFF") {
    navItems = [
      {
        href: "/home",
        icon: "🏠",
        label: locale === "en" ? "Home" : "首页",
        exact: true,
      },
      {
        href: "/staff",
        icon: "⚙️",
        label: t("home.admin"),
      },
    ];
  } else if (role === "SUPER_ADMIN") {
    navItems = [
      {
        href: "/home",
        icon: "🏠",
        label: locale === "en" ? "Home" : "首页",
        exact: true,
      },
      {
        href: "/ai-resume",
        icon: "✦",
        label: t("home.ai_resume"),
      },
      {
        href: "/applicant/dashboard",
        icon: "📋",
        label: t("home.create_profile"),
      },
      {
        href: "/timeline",
        icon: "📅",
        label: t("home.timeline"),
      },
      {
        href: "/budget",
        icon: "£",
        label: locale === "en" ? "Budget Planner" : "费用预算器",
      },
      {
        href: "/admin",
        icon: "⚙️",
        label: t("home.admin"),
      },
    ];
  } else {
    // STUDENT or default
    navItems = [
      {
        href: "/home",
        icon: "🏠",
        label: locale === "en" ? "Home" : "首页",
        exact: true,
      },
      {
        href: "/ai-resume",
        icon: "✦",
        label: t("home.ai_resume"),
      },
      {
        href: "/applicant/dashboard",
        icon: "📋",
        label: t("home.create_profile"),
      },
      {
        href: "/timeline",
        icon: "📅",
        label: t("home.timeline"),
      },
      {
        href: "/budget",
        icon: "£",
        label: locale === "en" ? "Budget Planner" : "费用预算器",
      },
    ];
  }

  const isActive = (href: string, exact?: boolean) => {
    if (!pathname) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header / Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          {!sidebarCollapsed && (
            <span className="font-bold text-slate-800 text-lg truncate">
              EngiMatch
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors ${
              sidebarCollapsed ? "mx-auto" : ""
            }`}
            aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {sidebarCollapsed ? "▶" : "◀"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all focus:ring-2 focus:ring-indigo-300 ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                    title={item.label}
                  >
                    <span
                      className={`text-xl flex-shrink-0 ${active ? "" : ""}`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-slate-100 space-y-1">
          {user ? (
            <>
              <Link
                href="/profile"
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors ${
                  sidebarCollapsed ? "justify-center" : ""
                } ${isActive("/profile", true) ? "bg-slate-100 font-medium" : ""}`}
                title={t("home.profile")}
              >
                <span className="text-lg" aria-hidden="true">
                  👤
                </span>
                {!sidebarCollapsed && <span>{t("home.profile")}</span>}
              </Link>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors ${
                  sidebarCollapsed ? "justify-center" : ""
                }`}
                title={t("home.logout")}
              >
                <span className="text-lg" aria-hidden="true">
                  🚪
                </span>
                {!sidebarCollapsed && <span>{t("home.logout")}</span>}
              </button>
            </>
          ) : (
            <div
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-slate-400 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                ⏳
              </span>
              {!sidebarCollapsed && <span>Loading...</span>}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
