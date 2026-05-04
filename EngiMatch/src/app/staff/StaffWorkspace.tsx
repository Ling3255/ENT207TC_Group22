"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface ProgrammeRecord {
  id: string;
  programme_name: string;
  degree_type: string;
  duration_text: string | null;
  intake_term: string | null;
  official_url: string;
  source_last_checked_at: string | null;
  updated_at: string;
  human_verified: boolean;
  is_active: boolean;
  university: {
    id: string;
    name: string;
    rank: number | null;
  };
}

interface UniversityRecord {
  id: string;
  name: string;
  rank: number | null;
  official_domain: string;
}

type FilterMode = "all" | "needs-review" | "stale" | "verified";

const STALE_DAYS = 90;

function daysSince(dateString: string | null) {
  if (!dateString) return Number.POSITIVE_INFINITY;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(value: string | null, locale: "en" | "zh") {
  if (!value) return locale === "en" ? "Not recorded" : "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Invalid date" : "日期无效";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function StaffWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [user, setUser] = useState<SessionUser | null>(null);
  const [programmes, setProgrammes] = useState<ProgrammeRecord[]>([]);
  const [universities, setUniversities] = useState<UniversityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("needs-review");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingUniversity, setCreatingUniversity] = useState(false);
  const [universityFormError, setUniversityFormError] = useState("");
  const [universityFormSuccess, setUniversityFormSuccess] = useState("");
  const [universityForm, setUniversityForm] = useState({
    name: "",
    official_domain: "",
    country: "UK",
    rank: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [sessionRes, programmesRes, universitiesRes] = await Promise.all([
          fetch("/api/auth/session"),
          fetch("/api/programmes?isActive=true"),
          fetch("/api/universities"),
        ]);

        const [sessionJson, programmesJson, universitiesJson] = await Promise.all([
          sessionRes.json(),
          programmesRes.json(),
          universitiesRes.json(),
        ]);

        const session = sessionJson?.data;
        if (!session?.authenticated) {
          window.location.href = "/login";
          return;
        }

        if (!cancelled) {
          setUser(session.user);
          setProgrammes(Array.isArray(programmesJson?.data) ? programmesJson.data : []);
          setUniversities(Array.isArray(universitiesJson?.data) ? universitiesJson.data : []);
        }
      } catch {
        if (!cancelled) {
          setError(isEnglish ? "Failed to load the staff workspace." : "加载工作人员工作台失败。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isEnglish]);

  const filteredProgrammes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return programmes.filter((programme) => {
      const stale = daysSince(programme.source_last_checked_at) > STALE_DAYS;
      const needsReview = !programme.human_verified;
      const matchesKeyword =
        keyword.length === 0 ||
        programme.programme_name.toLowerCase().includes(keyword) ||
        programme.university.name.toLowerCase().includes(keyword) ||
        programme.degree_type.toLowerCase().includes(keyword) ||
        (programme.intake_term ?? "").toLowerCase().includes(keyword);

      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "needs-review" && needsReview) ||
        (filterMode === "stale" && stale) ||
        (filterMode === "verified" && programme.human_verified);

      return matchesKeyword && matchesFilter;
    });
  }, [filterMode, programmes, search]);

  const stats = useMemo(() => {
    const activeProgrammes = programmes.filter((item) => item.is_active);
    const verifiedCount = activeProgrammes.filter((item) => item.human_verified).length;
    const staleCount = activeProgrammes.filter(
      (item) => daysSince(item.source_last_checked_at) > STALE_DAYS
    ).length;
    const needsReviewCount = activeProgrammes.length - verifiedCount;

    return {
      universityCount: universities.length,
      programmeCount: activeProgrammes.length,
      verifiedCount,
      staleCount,
      needsReviewCount,
    };
  }, [programmes, universities.length]);

  const priorityItems = useMemo(() => {
    return [...programmes]
      .filter(
        (programme) =>
          !programme.human_verified ||
          daysSince(programme.source_last_checked_at) > STALE_DAYS
      )
      .sort((a, b) => {
        const aDays = daysSince(a.source_last_checked_at);
        const bDays = daysSince(b.source_last_checked_at);

        if (a.human_verified !== b.human_verified) {
          return a.human_verified ? 1 : -1;
        }
        return bDays - aDays;
      })
      .slice(0, 6);
  }, [programmes]);

  const spotlightCards = [
    {
      label: isEnglish ? "Review queue" : "待处理队列",
      value: stats.needsReviewCount,
      note: isEnglish ? "Human checks still needed" : "仍需人工核验",
      accent: "mist" as const,
    },
    {
      label: isEnglish ? "Stale records" : "过期待更新",
      value: stats.staleCount,
      note: isEnglish ? `Over ${STALE_DAYS} days old` : `超过 ${STALE_DAYS} 天未更新`,
      accent: "brass" as const,
    },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleUniversityField =
    (field: keyof typeof universityForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setUniversityForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleCreateUniversity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUniversityFormError("");
    setUniversityFormSuccess("");
    setCreatingUniversity(true);

    try {
      const response = await fetch("/api/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...universityForm,
          rank: universityForm.rank.trim() ? Number(universityForm.rank) : null,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || (isEnglish ? "Failed to create the university." : "新增学校失败。")
        );
      }

      setUniversities((previous) =>
        [...previous, payload.data].sort((a, b) => {
          const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
          const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        })
      );
      setUniversityForm({
        name: "",
        official_domain: "",
        country: "UK",
        rank: "",
      });
      setUniversityFormSuccess(
        isEnglish
          ? "University created. You can now add programmes under it."
          : "学校已创建，现在可以继续为它新增项目。"
      );
    } catch (creationError) {
      setUniversityFormError(
        creationError instanceof Error
          ? creationError.message
          : isEnglish
            ? "Failed to create the university."
            : "新增学校失败。"
      );
    } finally {
      setCreatingUniversity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-50">
        <div className="text-slate-500">
          {isEnglish ? "Loading staff workspace..." : "正在加载工作人员工作台..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5rem] top-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-[-2rem] h-96 w-96 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-100 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/70 bg-white/72 px-5 py-3 shadow-[0_18px_50px_rgba(23,33,42,0.06)] backdrop-blur">
          {embedded ? (
            <div className="text-sm text-slate-500">
              {isEnglish ? "Role-based staff workspace" : "按角色整合的工作人员工作台"}
            </div>
          ) : (
            <Link href="/home" className="text-sm text-slate-500 transition hover:text-slate-900">
              {isEnglish ? "Back to home" : "返回首页"}
            </Link>
          )}
          <div className="text-xs uppercase tracking-[0.28em] text-indigo-600">
            {isEnglish ? "Staff launch workspace" : "工作人员入口工作台"}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-sm text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              {isEnglish ? "Profile" : "个人资料"}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              {isEnglish ? "Logout" : "退出登录"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[1.75rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_12px_34px_rgba(239,68,68,0.08)]">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-indigo-900/30 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-700 p-6 text-white shadow-[0_30px_80px_rgba(49,46,129,0.22)] sm:p-8">
            <div className="absolute right-[-8%] top-[-12%] h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute bottom-[-16%] left-[48%] h-52 w-52 rounded-full bg-white/5 blur-2xl" />

            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-indigo-100">
                <span>EngiMatch</span>
                <span>{isEnglish ? "Staff command surface" : "工作人员入口页"}</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
                {isEnglish
                  ? "Keep university data sharp from a more designed working surface"
                  : "在更有设计感的工作界面里维护院校与项目数据"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                {isEnglish
                  ? "Move from review work to programme creation, school maintenance, and source checks without losing orientation in a maze of admin pages."
                  : "从审核、建项、院校维护到来源核验，都可以在同一个更清晰的入口里自然切换，不再被后台页面层级打断。"}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/admin/verify"
                  className="rounded-[1.4rem] border border-white/15 bg-white/12 px-5 py-4 transition hover:bg-white/18"
                >
                  <div className="text-xs uppercase tracking-[0.24em] text-indigo-100">
                    {isEnglish ? "First action" : "建议先做"}
                  </div>
                  <div className="mt-2 text-xl font-semibold">
                    {isEnglish ? "Open review queue" : "打开核验队列"}
                  </div>
                  <div className="mt-2 text-sm text-[#f3eadf]">
                    {isEnglish
                      ? "Start from the records that still need a human decision."
                      : "优先处理仍然需要人工判断的记录。"}
                  </div>
                </Link>

                <Link
                  href="/admin/programmes/new"
                  className="rounded-[1.4rem] border border-indigo-200 bg-white/90 px-5 py-4 text-slate-900 transition hover:bg-indigo-50"
                >
                  <div className="text-xs uppercase tracking-[0.24em] text-indigo-600">
                    {isEnglish ? "Fast entry" : "快捷入口"}
                  </div>
                  <div className="mt-2 text-xl font-semibold">
                    {isEnglish ? "Create programme" : "新建项目"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {isEnglish
                      ? "Add a new programme once the university is in the system."
                      : "当学校已在系统中时，直接继续新增项目。"}
                  </div>
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <section className="rounded-[1.8rem] border border-slate-200 bg-white/82 p-5 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
              <div className="text-xs uppercase tracking-[0.26em] text-indigo-600">
                {isEnglish ? "Signed in as" : "当前登录"}
              </div>
              <div className="mt-4 text-lg font-semibold text-slate-900">
                {user?.name || user?.email}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isEnglish
                  ? "This page is the visual start point for staff operations before deeper edits."
                  : "这里是工作人员进入更深层编辑操作前的统一视觉入口。"}
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {spotlightCards.map((card) => (
                <HighlightCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  note={card.note}
                  accent={card.accent}
                />
              ))}
            </section>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title={isEnglish ? "Universities" : "院校数量"}
            value={stats.universityCount}
            tone="mist"
            note={
              isEnglish
                ? "Official institutions currently tracked"
                : "当前已纳入系统的学校"
            }
          />
          <StatCard
            title={isEnglish ? "Active Programmes" : "有效项目"}
            value={stats.programmeCount}
            tone="ink"
            note={isEnglish ? "Programmes visible to the platform" : "平台当前可用的项目"}
          />
          <StatCard
            title={isEnglish ? "Needs Review" : "待复核"}
            value={stats.needsReviewCount}
            tone="brass"
            note={
              isEnglish
                ? "Records still missing human verification"
                : "尚未完成人工核验的记录"
            }
          />
          <StatCard
            title={isEnglish ? "Stale Records" : "待更新"}
            value={stats.staleCount}
            tone="sand"
            note={
              isEnglish
                ? `Checked more than ${STALE_DAYS} days ago`
                : `${STALE_DAYS} 天以上未更新`
            }
          />
          <StatCard
            title={isEnglish ? "Verified" : "已确认"}
            value={stats.verifiedCount}
            tone="light"
            note={isEnglish ? "Records ready for student use" : "可供学生使用的记录"}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-[2rem] border border-[#e4d8cb] bg-white/85 p-6 shadow-[0_20px_60px_rgba(23,33,42,0.05)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-[#8a6639]">
                  {isEnglish ? "Main workflow" : "主要工作流"}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#1b2229]">
                  {isEnglish ? "University information maintenance" : "院校与项目信息维护"}
                </h2>
                <p className="mt-2 text-sm text-[#67707a]">
                  {isEnglish
                    ? "Search programmes, identify stale records, and jump straight into editing."
                    : "搜索项目、定位过期记录，并直接进入编辑处理。"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/programmes/new"
                  className="rounded-full bg-[#17313c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#244551]"
                >
                  {isEnglish ? "Add programme" : "新增项目"}
                </Link>
                <Link
                  href="/admin/verify"
                  className="rounded-full border border-[#dbc6ab] bg-[#fbf6ef] px-4 py-2 text-sm font-medium text-[#5c5041] transition hover:bg-[#f5ebde]"
                >
                  {isEnglish ? "Open review queue" : "打开审核队列"}
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_240px]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isEnglish
                    ? "Search by programme, university, degree type, or intake"
                    : "按项目、学校、学位类型或入学季搜索"
                }
                className="w-full rounded-[1.4rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                className="rounded-[1.4rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="needs-review">
                  {isEnglish ? "Needs review first" : "优先查看待复核"}
                </option>
                <option value="stale">{isEnglish ? "Stale records" : "仅看待更新"}</option>
                <option value="verified">{isEnglish ? "Verified only" : "仅看已确认"}</option>
                <option value="all">
                  {isEnglish ? "All active programmes" : "查看全部有效项目"}
                </option>
              </select>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-[#ebe1d5] bg-[#fffdfa]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#f7f1e8] text-[#6b747d]">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        {isEnglish ? "University" : "学校"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {isEnglish ? "Programme" : "项目"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {isEnglish ? "Status" : "状态"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {isEnglish ? "Last checked" : "上次核验"}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {isEnglish ? "Actions" : "操作"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgrammes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-[#7a8188]">
                          {isEnglish
                            ? "No programmes match the current filter."
                            : "当前筛选条件下没有匹配的项目。"}
                        </td>
                      </tr>
                    ) : (
                      filteredProgrammes.map((programme) => {
                        const staleDays = daysSince(programme.source_last_checked_at);
                        const stale = staleDays > STALE_DAYS;

                        return (
                          <tr key={programme.id} className="border-t border-[#f0e7dc] align-top">
                            <td className="px-4 py-4">
                              <div className="font-medium text-[#1c232a]">
                                {programme.university.name}
                              </div>
                              <div className="mt-1 text-xs text-[#7a8289]">
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
                              <div className="font-medium text-[#1c232a]">
                                {programme.programme_name}
                              </div>
                              <div className="mt-1 text-xs text-[#7a8289]">
                                {[programme.degree_type, programme.duration_text, programme.intake_term]
                                  .filter(Boolean)
                                  .join(" | ")}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge
                                  tone={programme.human_verified ? "green" : "amber"}
                                  label={
                                    programme.human_verified
                                      ? isEnglish
                                        ? "Verified"
                                        : "已确认"
                                      : isEnglish
                                        ? "Needs review"
                                        : "待复核"
                                  }
                                />
                                <StatusBadge
                                  tone={stale ? "rose" : "slate"}
                                  label={
                                    stale
                                      ? isEnglish
                                        ? "Update needed"
                                        : "需要更新"
                                      : isEnglish
                                        ? "Fresh"
                                        : "较新"
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[#616c75]">
                              <div>{formatDate(programme.source_last_checked_at, locale)}</div>
                              <div className="mt-1 text-xs text-[#7a8289]">
                                {Number.isFinite(staleDays)
                                  ? isEnglish
                                    ? `${staleDays} day(s) ago`
                                    : `${staleDays} 天前`
                                  : isEnglish
                                    ? "No source check recorded"
                                    : "暂无来源核验记录"}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-3">
                                <Link
                                  href={`/admin/programmes/${programme.id}`}
                                  className="text-sm font-medium text-[#8a6639] transition hover:text-[#6d4f2c]"
                                >
                                  {isEnglish ? "Edit" : "编辑"}
                                </Link>
                                <a
                                  href={programme.official_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-[#5f6a72] transition hover:text-[#172129]"
                                >
                                  {isEnglish ? "Official source" : "官方来源"}
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.9rem] border border-[#e4d8cb] bg-white/82 p-6 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
              <p className="text-sm font-medium text-[#8a6639]">
                {isEnglish ? "Add institution" : "新增学校"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#1b2229]">
                {isEnglish ? "Register a new university" : "登记新的院校"}
              </h2>
              <p className="mt-2 text-sm text-[#67707a]">
                {isEnglish
                  ? "Create the university first, then add its programmes in the next step."
                  : "先创建学校，再在下一步为它添加对应项目。"}
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleCreateUniversity}>
                <FormField
                  label={isEnglish ? "University name" : "学校名称"}
                  value={universityForm.name}
                  onChange={handleUniversityField("name")}
                  placeholder={isEnglish ? "University of Example" : "例如：某某大学"}
                  required
                />
                <FormField
                  label={isEnglish ? "Official domain" : "官网域名"}
                  value={universityForm.official_domain}
                  onChange={handleUniversityField("official_domain")}
                  placeholder="example.ac.uk"
                  required
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label={isEnglish ? "Country" : "国家"}
                    value={universityForm.country}
                    onChange={handleUniversityField("country")}
                    placeholder="UK"
                  />
                  <FormField
                    label={isEnglish ? "Rank" : "排名"}
                    value={universityForm.rank}
                    onChange={handleUniversityField("rank")}
                    placeholder={isEnglish ? "Optional" : "可选"}
                    type="number"
                  />
                </div>

                {universityFormError && (
                  <div className="rounded-[1.3rem] border border-[#e8cbbb] bg-[#fff5ee] px-4 py-3 text-sm text-[#9a5b3e]">
                    {universityFormError}
                  </div>
                )}
                {universityFormSuccess && (
                  <div className="rounded-[1.3rem] border border-[#d8c6a8] bg-[#f8f1e5] px-4 py-3 text-sm text-[#73593b]">
                    {universityFormSuccess}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={creatingUniversity}
                    className="rounded-full bg-[#17313c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#244451] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingUniversity
                      ? isEnglish
                        ? "Creating..."
                        : "创建中..."
                      : isEnglish
                        ? "Create university"
                        : "创建学校"}
                  </button>
                  <Link
                    href="/admin/programmes/new"
                    className="rounded-full border border-[#dbc6ab] bg-[#fbf6ef] px-4 py-2 text-sm font-medium text-[#5c5041] transition hover:bg-[#f5ebde]"
                  >
                    {isEnglish ? "Add programme next" : "下一步新增项目"}
                  </Link>
                </div>
              </form>
            </section>

            <section className="rounded-[1.9rem] border border-[#e4d8cb] bg-white/82 p-6 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
              <p className="text-sm font-medium text-[#8a6639]">
                {isEnglish ? "Priority queue" : "优先处理"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#1b2229]">
                {isEnglish ? "Records needing attention now" : "当前最需要处理的记录"}
              </h2>
              <div className="mt-4 space-y-3">
                {priorityItems.length === 0 ? (
                  <div className="rounded-[1.3rem] border border-[#d8c7ae] bg-[#f8f1e6] px-4 py-3 text-sm text-[#70583d]">
                    {isEnglish
                      ? "Everything is currently verified and recently checked."
                      : "当前记录都已确认，并且最近完成过核验。"}
                  </div>
                ) : (
                  priorityItems.map((programme) => (
                    <Link
                      key={programme.id}
                      href={`/admin/programmes/${programme.id}`}
                      className="block rounded-[1.4rem] border border-[#ede3d6] bg-[#fffdfa] px-4 py-3 transition hover:border-[#d4bb99] hover:bg-[#faf4eb]"
                    >
                      <div className="font-medium text-[#1b2229]">
                        {programme.programme_name}
                      </div>
                      <div className="mt-1 text-xs text-[#7b8389]">{programme.university.name}</div>
                      <div className="mt-2 text-xs text-[#64707a]">
                        {!programme.human_verified
                          ? isEnglish
                            ? "Pending human verification"
                            : "等待人工核验"
                          : daysSince(programme.source_last_checked_at) > STALE_DAYS
                            ? isEnglish
                              ? "Source information may be outdated"
                              : "来源信息可能已经过期"
                            : isEnglish
                              ? "Review recommended"
                              : "建议复核"}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[1.9rem] border border-[#e4d8cb] bg-white/82 p-6 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
              <p className="text-sm font-medium text-[#8a6639]">
                {isEnglish ? "Working rules" : "工作准则"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#1b2229]">
                {isEnglish ? "What staff should focus on" : "工作人员工作重点"}
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#64707a]">
                <li>
                  {isEnglish
                    ? "Use official university pages as the primary source for tuition, deadlines, and entry requirements."
                    : "以学校官网为主要来源，更新学费、截止日期和录取要求。"}
                </li>
                <li>
                  {isEnglish
                    ? "Staff may add new universities and programmes, while staff account approval stays with super administrators."
                    : "工作人员可以新增学校和项目，但 staff 账号审批仍由超级管理员负责。"}
                </li>
                <li>
                  {isEnglish
                    ? "Mark a record as verified only after manually checking the key fields."
                    : "关键字段完成人工核对后，再将记录标记为已确认。"}
                </li>
                <li>
                  {isEnglish
                    ? "Prioritize records that are unverified or unchecked for more than 90 days."
                    : "优先处理未确认或超过 90 天未核验的记录。"}
                </li>
                <li>
                  {isEnglish
                    ? "Keep official URLs and source check dates current so students can trust the guidance."
                    : "持续维护官方链接和核验日期，让学生能够信任平台信息。"}
                </li>
              </ul>
            </section>

            <section className="rounded-[1.9rem] border border-[#e4d8cb] bg-white/82 p-6 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
              <p className="text-sm font-medium text-[#8a6639]">
                {isEnglish ? "Institution coverage" : "院校覆盖"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#1b2229]">
                {isEnglish ? "Tracked universities" : "已追踪学校"}
              </h2>
              <div className="mt-4 space-y-3">
                {universities.slice(0, 8).map((university) => (
                  <div
                    key={university.id}
                    className="flex items-center justify-between rounded-[1.35rem] bg-[#faf5ee] px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-[#1b2229]">{university.name}</div>
                      <div className="text-xs text-[#7a8289]">{university.official_domain}</div>
                    </div>
                    <div className="text-xs font-medium text-[#6b737b]">
                      {university.rank
                        ? isEnglish
                          ? `Rank ${university.rank}`
                          : `排名 ${university.rank}`
                        : isEnglish
                          ? "No rank"
                          : "无排名"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function HighlightCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: number;
  note: string;
  accent: "mist" | "brass";
}) {
  const styleMap = {
    mist: "border-slate-200 bg-white/82 text-slate-900",
    brass: "border-indigo-100 bg-indigo-50 text-slate-900",
  };

  return (
    <div
      className={`rounded-[1.8rem] border p-5 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur ${styleMap[accent]}`}
    >
      <div className="text-xs uppercase tracking-[0.24em] text-indigo-600">{label}</div>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{note}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: number;
  note: string;
  tone: "mist" | "ink" | "brass" | "sand" | "light";
}) {
  const toneMap = {
    mist: "border-slate-200 bg-white/82 text-slate-900",
    ink: "border-indigo-900/30 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-700 text-white",
    brass:
      "border-indigo-300 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white",
    sand: "border-indigo-100 bg-indigo-50 text-slate-900",
    light: "border-slate-200 bg-white text-slate-900",
  };

  return (
    <div
      className={`rounded-[1.7rem] border p-5 shadow-[0_18px_50px_rgba(23,33,42,0.05)] ${toneMap[tone]}`}
    >
      <div
        className={`text-sm ${
          tone === "ink" || tone === "brass" ? "text-white/80" : "text-indigo-600"
        }`}
      >
        {title}
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      <div
        className={`mt-2 text-xs ${
          tone === "ink" || tone === "brass" ? "text-white/80" : "text-slate-500"
        }`}
      >
        {note}
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "rose" | "slate";
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-[1.3rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
