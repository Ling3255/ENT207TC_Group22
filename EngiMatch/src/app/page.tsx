"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";

export default function LoginHomePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          // Already logged in, redirect to home
          router.push("/home");
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, [router]);

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

      showToast(
        locale === "en" ? "Login successful!" : "登录成功！",
        "success"
      );

      // Redirect based on role
      if (data.data.user.role === "SUPER_ADMIN") {
        router.push("/admin/users");
      } else if (data.data.user.role === "STAFF") {
        router.push("/staff");
      } else {
        router.push("/home");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="text-slate-400">{locale === "en" ? "Loading..." : "加载中..."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-600">EngiMatch</h1>
          <p className="text-slate-500 mt-2">
            {locale === "en"
              ? "UK Engineering Master's Programme Matching"
              : "英国工程硕士项目智能匹配"}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            {locale === "en" ? "Welcome Back" : "欢迎回来"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label={locale === "en" ? "Email" : "邮箱"}
              value={email}
              onChange={setEmail}
              placeholder="example@example.com"
              required
            />
            <Input
              type="password"
              label={locale === "en" ? "Password" : "密码"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? locale === "en"
                  ? "Logging in..."
                  : "登录中..."
                : locale === "en"
                ? "Login"
                : "登录"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {locale === "en" ? "Don't have an account?" : "还没有账号？"}
            <Link
              href="/register"
              className="text-indigo-600 hover:underline ml-1 font-medium"
            >
              {locale === "en" ? "Register" : "立即注册"}
            </Link>
          </div>
        </div>

        {/* Setup hint */}
        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700 text-center">
          {locale === "en"
            ? "Forgot password? Please contact your administrator."
            : "忘记密码？请联系超级管理员重置密码。"}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400">
          EngiMatch &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
