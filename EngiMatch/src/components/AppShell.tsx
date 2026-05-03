"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";
import SubNavTabs from "./SubNavTabs";

const HIDDEN_SIDEBAR_ROUTES = ["/", "/login", "/register", "/setup"];

const SESSION_CACHE_KEY = "engimatch_session_user";
const SESSION_EVENT_NAME = "engimatch-session-changed";

type SessionUser = {
  role: string;
  email: string;
  name?: string | null;
};

function readCachedUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function writeCachedUser(user: SessionUser | null) {
  if (typeof window === "undefined") return;

  if (!user) {
    window.sessionStorage.removeItem(SESSION_CACHE_KEY);
  } else {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
  }

  window.dispatchEvent(new Event(SESSION_EVENT_NAME));
}

function getDisplayName(user: SessionUser | null, locale: string) {
  if (!user) return locale === "en" ? "Account" : "账户";
  if (user.name?.trim()) return user.name.trim();
  return user.email.split("@")[0] || user.email;
}

function getAvatarText(user: SessionUser | null) {
  if (!user) return "?";

  const source = (user.name?.trim() || user.email || "").replace(/@.*$/, "").trim();
  if (!source) return "?";

  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userReady, setUserReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncCachedUser = () => {
      setUser((current) => current ?? readCachedUser());
    };

    syncCachedUser();
    window.addEventListener(SESSION_EVENT_NAME, syncCachedUser);

    return () => {
      window.removeEventListener(SESSION_EVENT_NAME, syncCachedUser);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = await response.json();
        const session = payload?.data;
        const nextUser = session?.authenticated ? (session.user as SessionUser) : null;

        if (!cancelled) {
          setUser(nextUser);
          setUserReady(true);
          writeCachedUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          setUserReady(true);
        }
      }
    }

    syncSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    writeCachedUser(null);
    showToast(locale === "en" ? "Logged out" : "已退出登录", "info");
    window.location.href = "/";
  };

  const showSidebar = pathname ? !HIDDEN_SIDEBAR_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/")) : false;
  const role = user?.role;
  const userDisplayName = useMemo(() => getDisplayName(user, locale), [locale, user]);
  const userAvatarText = useMemo(() => getAvatarText(user), [user]);

  const roleLabel = useMemo(() => {
    if (role === "SUPER_ADMIN") return locale === "en" ? "Admin" : "管理员";
    if (role === "STAFF") return locale === "en" ? "Staff" : "工作人员";
    if (role === "STUDENT") return locale === "en" ? "Student" : "学生";
    return locale === "en" ? "Signed in" : "已登录";
  }, [locale, role]);

  const managementHref =
    role === "SUPER_ADMIN" ? "/admin" : role === "STAFF" ? "/staff" : null;
  const managementLabel =
    role === "SUPER_ADMIN"
      ? t("home.admin")
      : role === "STAFF"
        ? locale === "en"
          ? "Staff Workspace"
          : "工作人员后台"
        : "";

  const navItems: { href: string; icon: string; label: string; exact?: boolean }[] =
    [
      {
        href: "/home",
        icon: "🏠",
        label: locale === "en" ? "Home" : "首页",
        exact: true,
      },
      {
        href: "/ai-resume",
        icon: "✨",
        label: t("home.ai_resume"),
      },
      {
        href: "/applicant/dashboard",
        icon: "📝",
        label: t("home.create_profile"),
      },
      {
        href: "/timeline",
        icon: "🗓️",
        label: t("home.timeline"),
      },
      {
        href: "/budget",
        icon: "£",
        label: locale === "en" ? "Budget Planner" : "费用预算器",
      },
      ...(role === "SUPER_ADMIN"
        ? [
            {
              href: "/admin" as const,
              icon: "🧭",
              label: t("home.admin"),
            },
          ]
        : []),
      ...(role === "STAFF"
        ? [
            {
              href: "/staff" as const,
              icon: "🧭",
              label: locale === "en" ? "Staff Workspace" : "工作人员后台",
            },
          ]
        : []),
    ];

  const isActive = (href: string, exact?: boolean) => {
    if (!pathname) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!showSidebar) {
    return <>{children}</>;
  }

  const showUserCard = Boolean(user) || userReady;

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        className={`flex-shrink-0 flex flex-col h-full bg-white border-r border-slate-200 shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          {!sidebarCollapsed && (
            <span className="truncate text-lg font-bold text-slate-800">EngiMatch</span>
          )}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 ${
              sidebarCollapsed ? "mx-auto" : ""
            }`}
            aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {sidebarCollapsed ? "▸" : "◂"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Main navigation">
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
                    <span className="flex-shrink-0 text-xl" aria-hidden="true">
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-2" ref={menuRef}>
          {showUserCard ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenuOpen(true);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100 ${
                  sidebarCollapsed ? "justify-center" : ""
                }`}
                title={userDisplayName}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {userAvatarText}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {userDisplayName}
                      </div>
                      <div className="truncate text-xs text-slate-500">{roleLabel}</div>
                    </div>
                    <div className="text-lg leading-none text-slate-400">⋯</div>
                  </>
                )}
              </button>

              {menuOpen && user && (
                <div
                  className={`absolute bottom-full z-20 mb-2 min-w-[210px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ${
                    sidebarCollapsed ? "left-0" : "left-2 right-2"
                  }`}
                >
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 ${
                      isActive("/profile", true) ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    <span aria-hidden="true">👤</span>
                    <span>{t("home.profile")}</span>
                  </Link>

                  {managementHref && (
                    <Link
                      href={managementHref}
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <span aria-hidden="true">🧭</span>
                      <span>{managementLabel}</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                  >
                    <span aria-hidden="true">↩</span>
                    <span>{t("home.logout")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-16 animate-pulse rounded bg-slate-100" />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto h-full">
        <SubNavTabs />
        {children}
      </main>
    </div>
  );
}
