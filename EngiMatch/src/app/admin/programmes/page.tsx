"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Programme {
  id: string;
  programme_name: string;
  degree_type: string;
  duration_text: string | null;
  is_active: boolean;
  human_verified: boolean;
  university: { name: string; rank: number | null };
}

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    const url = `/api/programmes?isActive=${filterActive}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setProgrammes(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filterActive, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("确定软删除此项目？")) return;
    await fetch(`/api/programmes/${id}`, { method: "DELETE" });
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm text-slate-400 hover:text-white mb-4 inline-block">← 管理后台</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">项目列表</h1>
              <p className="text-slate-400 mt-1">管理英国工程硕士项目数据</p>
            </div>
            <Link href="/admin/programmes/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              + 添加项目
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="搜索项目名称、学校..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            value={filterActive ? "active" : "all"}
            onChange={(e) => setFilterActive(e.target.value === "active")}
          >
            <option value="active">仅活跃项目</option>
            <option value="all">全部项目</option>
          </select>
          <Link href="/admin/verify" className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">
            数据审核
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">加载中...</div>
        ) : programmes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>暂无项目数据</p>
            <Link href="/admin/programmes/new" className="text-indigo-600 hover:underline mt-2 inline-block">添加第一个项目 →</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">学校</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">项目名称</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">类型</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">学制</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">状态</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {p.university.rank ?? "?"}
                          </div>
                          <span className="font-medium text-slate-800">{p.university.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.programme_name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.degree_type}</td>
                      <td className="px-4 py-3 text-slate-500">{p.duration_text ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {p.human_verified
                            ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">已确认</span>
                            : <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">待审核</span>
                          }
                          {!p.is_active && <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">已删除</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 text-xs">
                          <Link href={`/admin/programmes/${p.id}`} className="text-indigo-600 hover:underline">编辑</Link>
                          <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}