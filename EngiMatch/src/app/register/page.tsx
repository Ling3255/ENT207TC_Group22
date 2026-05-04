"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

function RegisterPageInner() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(locale === "en" ? "Passwords do not match" : "两次密码输入不一致");
      return;
    }

    if (formData.password.length < 6) {
      setError(locale === "en" ? "Password must be at least 6 characters" : "密码至少需要6个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || null,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      // Show success message and redirect
      if (formData.role === "STAFF") {
        alert(locale === "en" 
          ? "Registration successful! Please wait for Super Admin approval."
          : "注册成功！请等待超级管理员审批后登录。");
      }
      router.push("/login");

    } catch (err) {
      setError(locale === "en" ? "Network error, please try again" : "网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center px-4 py-8">
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

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            {locale === "en" ? "Create Account" : "创建账号"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {locale === "en" ? "I am a..." : "我是..."}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "STUDENT" })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.role === "STUDENT"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className={`text-sm font-medium ${formData.role === "STUDENT" ? "text-indigo-700" : "text-slate-700"}`}>
                    {locale === "en" ? "Student" : "学生"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {locale === "en" ? "Apply for programmes" : "申请项目"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "STAFF" })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    formData.role === "STAFF"
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍💼</div>
                  <div className={`text-sm font-medium ${formData.role === "STAFF" ? "text-indigo-700" : "text-slate-700"}`}>
                    {locale === "en" ? "Staff" : "工作人员"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {locale === "en" ? "Needs approval" : "需审批"}
                  </div>
                </button>
              </div>
            </div>

            {/* Name (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === "en" ? "Name (Optional)" : "姓名（选填）"}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={locale === "en" ? "Your name" : "您的姓名"}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === "en" ? "Email *" : "邮箱 *"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="example@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === "en" ? "Password *" : "密码 *"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                {locale === "en" ? "At least 6 characters" : "至少6个字符"}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === "en" ? "Confirm Password *" : "确认密码 *"}
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Staff Notice */}
            {formData.role === "STAFF" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                {locale === "en"
                  ? "Staff accounts require approval from a Super Admin before you can login."
                  : "工作人员账号需要超级管理员审批后才能登录。"}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading 
                ? (locale === "en" ? "Creating account..." : "创建账号中...")
                : (locale === "en" ? "Create Account" : "创建账号")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {locale === "en" ? "Already have an account?" : "已有账号？"}
            <Link href="/login" className="text-indigo-600 hover:underline ml-1">
              {locale === "en" ? "Login" : "立即登录"}
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
            ← {locale === "en" ? "Back to Login" : "返回登录页"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageInner />
    </Suspense>
  );
}
