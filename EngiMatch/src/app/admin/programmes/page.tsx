"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

interface Programme {
  id: string;
  programme_name: string;
  degree_type: string;
  duration_text: string | null;
  intake_term: string | null;
  is_active: boolean;
  human_verified: boolean;
  updated_at?: string;
  university: {
    name: string;
    rank: number | null;
  };
}

export default function AdminProgrammesPage() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProgrammes() {
      setLoading(true);
      setError("");

      try {
        const url = `/api/programmes?isActive=${filterActive}${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`;
        const response = await fetch(url);
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.error ||
              (isEnglish
                ? "Failed to load programme records."
                : "加载专业库失败。")
          );
        }

        if (!cancelled) {
          setProgrammes(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setProgrammes([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : isEnglish
                ? "Failed to load programme records."
                : "加载专业库失败。"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProgrammes();

    return () => {
      cancelled = true;
    };
  }, [filterActive, isEnglish, search]);

  const totalText = useMemo(() => {
    if (isEnglish) {
      return `${programmes.length} programme record(s)`;
    }
    return `共 ${programmes.length} 条专业记录`;
  }, [isEnglish, programmes.length]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      isEnglish
        ? "Deactivate this programme record?"
        : "确认将这个专业记录停用吗？"
    );

    if (!confirmed) return;

    const response = await fetch(`/api/programmes/${id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.success === false) {
      setError(
        payload?.error ||
          (isEnglish ? "Failed to deactivate the programme." : "停用专业失败。")
      );
      return;
    }

    setProgrammes((previous) => previous.filter((programme) => programme.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Link
            href="/admin"
            className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
          >
            {isEnglish ? "< Back to workspace" : "< 返回后台工作台"}
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
                {isEnglish ? "Programme Library" : "专业库"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                {isEnglish
                  ? "View and maintain saved programmes"
                  : "查看并维护已保存专业"}
              </h1>
              <p className="mt-3 text-sm text-slate-300">{totalText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/programmes/new"
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
              >
                {isEnglish ? "Create programme" : "新建专业"}
              </Link>
              <Link
                href="/admin/verify"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {isEnglish ? "Open verification queue" : "打开核验队列"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder={
                isEnglish
                  ? "Search by programme name, university, degree type, or intake"
                  : "按专业名称、学校、学位类型或入学季搜索"
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              value={filterActive ? "active" : "all"}
              onChange={(event) => setFilterActive(event.target.value === "active")}
            >
              <option value="active">
                {isEnglish ? "Active only" : "仅看有效专业"}
              </option>
              <option value="all">
                {isEnglish ? "All records" : "查看全部记录"}
              </option>
            </select>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      {isEnglish ? "University" : "学校"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {isEnglish ? "Programme" : "专业"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {isEnglish ? "Status" : "状态"}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      {isEnglish ? "Actions" : "操作"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        {isEnglish ? "Loading programmes..." : "正在加载专业库..."}
                      </td>
                    </tr>
                  ) : programmes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        {isEnglish
                          ? "No saved programmes match the current filter."
                          : "当前筛选条件下没有已保存专业。"}
                      </td>
                    </tr>
                  ) : (
                    programmes.map((programme) => (
                      <tr key={programme.id} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">
                            {programme.university.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {programme.university.rank
                              ? isEnglish
                                ? `Rank ${programme.university.rank}`
                                : `排名 ${programme.university.rank}`
                              : isEnglish
                                ? "Rank not set"
                                : "未设置排名"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">
                            {programme.programme_name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {[programme.degree_type, programme.duration_text, programme.intake_term]
                              .filter(Boolean)
                              .join(" | ")}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              label={
                                programme.human_verified
                                  ? isEnglish
                                    ? "Verified"
                                    : "已确认"
                                  : isEnglish
                                    ? "Needs review"
                                    : "待复核"
                              }
                              tone={programme.human_verified ? "green" : "amber"}
                            />
                            {!programme.is_active && (
                              <Badge
                                label={isEnglish ? "Inactive" : "已停用"}
                                tone="slate"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/admin/programmes/${programme.id}`}
                              className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                            >
                              {isEnglish ? "Edit" : "编辑"}
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(programme.id)}
                              className="text-sm font-medium text-rose-600 hover:text-rose-800"
                            >
                              {isEnglish ? "Deactivate" : "停用"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "slate";
}) {
  const styles = {
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  );
}
