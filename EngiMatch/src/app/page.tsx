import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          EngiMatch
        </h1>
        <p className="text-xl text-slate-600 mb-2">
          英国工程硕士项目智能匹配
        </p>
        <p className="text-base text-slate-400 mb-12">
          为中国工科本科生精准评估英国院校的适配度
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link
            href="/applicant"
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-4xl">📋</div>
            <div className="font-semibold text-slate-900">创建申请档案</div>
            <div className="text-sm text-slate-500">录入成绩和背景信息</div>
          </Link>
          <Link
            href="/admin"
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="text-4xl">⚙️</div>
            <div className="font-semibold text-slate-900">管理后台</div>
            <div className="text-sm text-slate-500">管理项目和评估规则</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
