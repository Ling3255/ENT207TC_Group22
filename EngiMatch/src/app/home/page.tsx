"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";

export default function HomePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<{ role: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        const session = data.data;
        if (session?.authenticated) {
          setUser(session.user);
        } else {
          // Not logged in, redirect to login page
          router.push("/");
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setCheckingAuth(false));
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="text-slate-400">
          {locale === "en" ? "Loading..." : "加载中..."}
        </div>
      </div>
    );
  }

  if (!user) return null; // Will redirect

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-6 py-12">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          EngiMatch
        </h1>
        <p className="text-xl text-slate-600 mb-2">{t("home.subtitle")}</p>
        <p className="text-base text-slate-400 mb-10">
          {t("home.description")}
        </p>

        {/* User Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 inline-block shadow-sm">
          <p className="text-slate-700 text-lg mb-1 font-medium">
            {user.role === "SUPER_ADMIN"
              ? "🔐 超级管理员"
              : user.role === "STAFF"
              ? "👨‍💼 工作人员"
              : "🎓 学生"}
          </p>
          <p className="text-sm text-slate-400 mb-5">{user.email}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={
                user.role === "SUPER_ADMIN"
                  ? "/admin/users"
                  : user.role === "STAFF"
                  ? "/staff"
                  : "/applicant/dashboard"
              }
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              {t("home.go_dashboard")}
            </Link>
            <Link
              href="/profile"
              className="px-5 py-2.5 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
            >
              {t("home.profile")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
