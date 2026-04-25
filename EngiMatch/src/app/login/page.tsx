"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export default function LoginPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      // Redirect based on role
      if (data.user.role === "SUPER_ADMIN") {
        router.push("/admin/users");
      } else if (data.user.role === "STAFF") {
        router.push("/staff");
      } else {
        router.push("/applicant");
      }

    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-indigo-600">EngiMatch</h1>
          </Link>
          <p className="text-slate-500 mt-2">
            {locale === "en" ? "UK Engineering Master's Programme Matching" : "英国工程硕士项目智能匹配"}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            {locale === "en" ? "Login" : "登录"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === "en" ? "Email" : "邮箱"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="example@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === "en" ? "Password" : "密码"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (locale === "en" ? "Logging in..." : "登录中...") : (locale === "en" ? "Login" : "登录")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {locale === "en" ? "Don't have an account?" : "还没有账号？"}
            <Link href="/register" className="text-indigo-600 hover:underline ml-1">
              {locale === "en" ? "Register" : "立即注册"}
            </Link>
          </div>
        </div>

        {/* Forgot Password Notice */}
        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700 text-center">
          {locale === "en" 
            ? "Forgot password? Please contact your administrator."
            : "忘记密码？请联系超级管理员重置密码。"}
        </div>

        {/* Language Toggle */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← {locale === "en" ? "Back to Login" : "返回登录首页"}
          </Link>
        </div>
      </div>
    </div>
  );
}
