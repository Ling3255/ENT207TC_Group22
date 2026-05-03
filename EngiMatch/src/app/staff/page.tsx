"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function StaffDashboard() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const returnTo = useMemo(() => {
    const value = searchParams.get("returnTo");
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return null;
    }
    return value;
  }, [searchParams]);

  const programmeCreateHref =
    returnTo && returnTo.startsWith("/admin/programmes/new")
      ? returnTo
      : `/admin/programmes/new?returnTo=${encodeURIComponent("/staff")}`;

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
        if (session.user?.role !== "STAFF" && session.user?.role !== "SUPER_ADMIN") {
          if (!cancelled) {
            setError(
              isEnglish
                ? "Insufficient permissions. Staff or admin access required."
                : "权限不足，此页面需要工作人员或管理员权限。"
            );
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setUser(session.user);
          setProgrammes(Array.isArray(programmesJson?.data) ? programmesJson.data : []);
          setUniversities(Array.isArray(universitiesJson?.data) ? universitiesJson.data : []);
        }
      } catch {
        if (!cancelled) {
          setError(
            isEnglish ? "Failed to load the staff workspace." : "加载工作人员工作台失败。"
          );
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
          payload?.error ||
            (isEnglish ? "Failed to create the university." : "新增学校失败。")
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

      if (returnTo) {
        router.push(returnTo);
        return;
      }

      setUniversityFormSuccess(
        isEnglish
          ? "University created. You can now add programmes under it."
          : "学校已创建，现在可以继续新增该校专业。"
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">
          {isEnglish ? "Loading staff workspace..." : "正在加载工作人员工作台..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={returnTo ?? "/home"}
              className="mb-3 inline-block text-sm text-slate-300 transition hover:text-white"
            >
              {isEnglish ? "< Back to home" : "< 返回首页"}
            </Link>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
              {isEnglish ? "Staff Workspace" : "工作人员工作台"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {isEnglish
                ? "Keep university information fresh and trustworthy"
                : "及时维护学校信息，确保数据准确可靠"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">
              {isEnglish
                ? "Update programme details from official university sources, review unverified records, and keep deadlines current for students."
                : "根据学校官网更新专业信息，复核待确认记录，并及时维护申请截止时间。"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <div className="text-slate-300">
                {isEnglish ? "Signed in as" : "当前登录"}
              </div>
              <div className="font-medium text-white">{user?.name || user?.email}</div>
            </div>
            <Link
              href="/profile"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
            >
              {isEnglish ? "Profile" : "个人资料"}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
            >
              {isEnglish ? "Logout" : "退出登录"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title={isEnglish ? "Universities" : "学校数量"}
            value={stats.universityCount}
            tone="slate"
            note={
              isEnglish
                ? "Official institutions currently tracked"
                : "当前已纳入系统的学校"
            }
          />
          <StatCard
            title={isEnglish ? "Active Programmes" : "有效项目"}
            value={stats.programmeCount}
            tone="cyan"
            note={isEnglish ? "Programmes visible to the platform" : "平台当前可用的项目"}
          />
          <StatCard
            title={isEnglish ? "Needs Review" : "待复核"}
            value={stats.needsReviewCount}
            tone="amber"
            note={
              isEnglish
                ? "Records still missing human verification"
                : "仍未进行人工确认的记录"
            }
          />
          <StatCard
            title={isEnglish ? "Stale Records" : "待更新"}
            value={stats.staleCount}
            tone="rose"
            note={
              isEnglish
                ? `Checked more than ${STALE_DAYS} days ago`
                : `${STALE_DAYS} 天以上未更新`
            }
          />
          <StatCard
            title={isEnglish ? "Verified" : "已确认"}
            value={stats.verifiedCount}
            tone="emerald"
            note={isEnglish ? "Records ready for student use" : "可供学生使用的记录"}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">
                  {isEnglish ? "Main workflow" : "主要工作流"}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {isEnglish ? "University information maintenance" : "学校信息维护"}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {isEnglish
                    ? "Search programmes, identify stale records, and jump straight into editing."
                    : "搜索项目、定位过期记录，并直接进入编辑。"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={programmeCreateHref}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  {isEnglish ? "Add programme" : "新增专业"}
                </Link>
                <Link
                  href="/admin/verify"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {isEnglish ? "Open review queue" : "打开审核队列"}
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 lg:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isEnglish
                    ? "Search by programme, university, degree type, or intake"
                    : "按专业、学校、学位类型或入学季搜索"
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="needs-review">
                  {isEnglish ? "Needs review first" : "优先看待复核"}
                </option>
                <option value="stale">{isEnglish ? "Stale records" : "仅看待更新"}</option>
                <option value="verified">
                  {isEnglish ? "Verified only" : "仅看已确认"}
                </option>
                <option value="all">
                  {isEnglish ? "All active programmes" : "查看全部有效项目"}
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
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
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
                            <td className="px-4 py-4 text-slate-600">
                              <div>{formatDate(programme.source_last_checked_at, locale)}</div>
                              <div className="mt-1 text-xs text-slate-500">
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
                                  className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
                                >
                                  {isEnglish ? "Edit" : "编辑"}
                                </Link>
                                <a
                                  href={programme.official_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
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
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Add institution" : "新增学校"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {isEnglish ? "Staff can register a new university" : "工作人员可以新增学校"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isEnglish
                  ? "Create the university first, then use the add programme flow to attach new degrees."
                  : "先创建学校，再通过新增专业流程录入该校项目。"}
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
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {universityFormError}
                  </div>
                )}
                {universityFormSuccess && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {universityFormSuccess}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={creatingUniversity}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                    href={programmeCreateHref}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {isEnglish ? "Add programme next" : "下一步新增专业"}
                  </Link>
                </div>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Priority queue" : "优先处理"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {isEnglish ? "Records needing attention now" : "当前最需要处理的记录"}
              </h2>
              <div className="mt-4 space-y-3">
                {priorityItems.length === 0 ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {isEnglish
                      ? "Everything is currently verified and recently checked."
                      : "当前记录都已确认，且最近有更新。"}
                  </div>
                ) : (
                  priorityItems.map((programme) => (
                    <Link
                      key={programme.id}
                      href={`/admin/programmes/${programme.id}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-cyan-300 hover:bg-slate-50"
                    >
                      <div className="font-medium text-slate-900">
                        {programme.programme_name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {programme.university.name}
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        {!programme.human_verified
                          ? isEnglish
                            ? "Pending human verification"
                            : "等待人工确认"
                          : daysSince(programme.source_last_checked_at) > STALE_DAYS
                            ? isEnglish
                              ? "Source information may be outdated"
                              : "来源信息可能已过期"
                            : isEnglish
                              ? "Review recommended"
                              : "建议复核"}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Working rules" : "工作准则"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {isEnglish ? "What staff should focus on" : "工作人员重点工作"}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>
                  {isEnglish
                    ? "Use official university pages as the primary source for tuition, deadlines, and entry requirements."
                    : "以学校官网为主来源，更新学费、截止日期和录取要求。"}
                </li>
                <li>
                  {isEnglish
                    ? "Staff may add new universities and new programmes, but approval of staff accounts remains restricted to super administrators."
                    : "工作人员可以新增学校和专业，但 staff 账号审批仍只属于超级管理员。"}
                </li>
                <li>
                  {isEnglish
                    ? "Mark a record as verified only after checking the key fields manually."
                    : "关键字段人工核对完成后，再标记为已确认。"}
                </li>
                <li>
                  {isEnglish
                    ? "Prioritize records that are unverified or have not been checked for more than 90 days."
                    : "优先处理未确认或超过 90 天未核验的记录。"}
                </li>
                <li>
                  {isEnglish
                    ? "Keep official URLs and source check dates current so students can trust the guidance."
                    : "维护好官方链接和核验日期，让学生能信任平台信息。"}
                </li>
              </ul>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-cyan-700">
                {isEnglish ? "Institution coverage" : "学校覆盖"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {isEnglish ? "Tracked universities" : "已追踪学校"}
              </h2>
              <div className="mt-4 space-y-3">
                {universities.slice(0, 8).map((university) => (
                  <div
                    key={university.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{university.name}</div>
                      <div className="text-xs text-slate-500">
                        {university.official_domain}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-slate-500">
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
      </div>
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
  tone: "slate" | "cyan" | "amber" | "rose" | "emerald";
}) {
  const toneMap = {
    slate: "from-slate-800 to-slate-700",
    cyan: "from-cyan-600 to-sky-600",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-600",
    emerald: "from-emerald-500 to-teal-600",
  };

  return (
    <div className={`rounded-3xl bg-gradient-to-br ${toneMap[tone]} p-5 text-white shadow-sm`}>
      <div className="text-sm text-white/80">{title}</div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-xs text-white/80">{note}</div>
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
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
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
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}
