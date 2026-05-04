"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function SetupPageInner() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const res = await fetch("/api/auth/setup");
      const data = await res.json();
      
      if (data.hasSuperAdmin) {
        router.push("/login");
        return;
      }
      
      if (data.needsSetup) {
        setLoading(false);
      }
    } catch {
      setError("检查失败，请刷新页面重试");
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/setup", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "初始化失败");
        return;
      }

      setSuccess(true);
      
      // Auto login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">初始化完成！</h1>
          <p className="text-slate-600 mb-4">
            超级管理员账号已创建
          </p>
          <div className="bg-slate-100 rounded-lg p-4 text-left mb-4">
            <p className="text-sm text-slate-600"><strong>账号：</strong>admin@engimatch.com</p>
            <p className="text-sm text-slate-600"><strong>密码：</strong>admin123</p>
          </div>
          <p className="text-amber-600 text-sm mb-4">
            ⚠️ 请立即登录并修改默认密码！
          </p>
          <p className="text-slate-400 text-sm">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-slate-900">EngiMatch 初始化</h1>
          <p className="text-slate-500 mt-2">
            首次使用，需要创建超级管理员账号
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-amber-800 mb-2">⚠️ 重要提示</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 将创建默认管理员账号</li>
            <li>• 默认密码为 <code className="bg-amber-100 px-1 rounded">admin123</code></li>
            <li>• 首次登录后请立即修改密码</li>
          </ul>
        </div>

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "初始化中..." : "开始初始化"}
        </button>

        <div className="mt-4 text-center text-sm text-slate-400">
          <a href="/home" className="hover:text-slate-600">← 返回首页</a>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupPageInner />
    </Suspense>
  );
}
