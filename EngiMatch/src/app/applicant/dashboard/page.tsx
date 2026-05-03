"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";
import { useToast } from "@/components/ToastProvider";
import { getAiResumeMajorLabel } from "@/lib/ai-resume-majors";

interface ApplicantCard {
  id: string;
  full_name: string | null;
  undergrad_university: string | null;
  undergrad_major: string | null;
  gpa_numeric: number | null;
  gpa_scale: number | null;
  ielts_overall: number | null;
  toefl_total: number | null;
  created_at: string;
  updated_at: string;
  target_tracks: string[];
  modules: Array<{
    module_name_raw: string;
    grade_text: string | null;
    credits: number | null;
  }>;
  _count: { evaluations: number };
}

type QuickTool = {
  href: string;
  icon: string;
  title: string;
  description: string;
  accent: "dark" | "warm" | "soft";
};

function toolClasses(accent: QuickTool["accent"]) {
  if (accent === "dark") {
    return "border-[#203644] bg-gradient-to-br from-[#13242f] via-[#1b3340] to-[#304957] text-white";
  }
  if (accent === "warm") {
    return "border-[#dbc49f] bg-gradient-to-br from-[#caa069] via-[#b68851] to-[#8c653c] text-white";
  }
  return "border-[#e6dbcf] bg-[#fffdf8] text-[#1d252d]";
}

export default function ApplicantDashboard() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState<ApplicantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isZh = locale === "zh";

  const formatTrackLabel = (track: string) => {
    const primary = getAiResumeMajorLabel(track, locale);
    const secondary =
      locale === "en"
        ? getAiResumeMajorLabel(track, "zh")
        : getAiResumeMajorLabel(track, "en");
    return `${primary} / ${secondary}`;
  };

  useEffect(() => {
    fetchMyApplicants();
  }, []);

  const fetchMyApplicants = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/applicants/my");
      const payload = await response.json();
      setApplicants(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      showToast(isZh ? "加载失败" : "Load failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        isZh
          ? "确定删除此档案吗？相关匹配结果也会一起删除。"
          : "Delete this profile? Related evaluations will also be removed."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/applicants/${id}`, { method: "DELETE" });
      if (response.ok) {
        showToast(isZh ? "删除成功" : "Deleted", "success");
        setApplicants((previous) => previous.filter((item) => item.id !== id));
      } else {
        showToast(isZh ? "删除失败" : "Delete failed", "error");
      }
    } catch {
      showToast(isZh ? "网络错误" : "Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await fetch("/api/auth/session");
      router.push(`/applicant/results?applicantId=${id}`);
    } catch {
      router.push(`/applicant/results?applicantId=${id}`);
    }
  };

  const stats = useMemo(() => {
    const totalMatches = applicants.reduce(
      (sum, item) => sum + item._count.evaluations,
      0
    );
    const totalCourses = applicants.reduce(
      (sum, item) => sum + item.modules.length,
      0
    );
    const latestProfile = [...applicants].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];

    return {
      profiles: applicants.length,
      matches: totalMatches,
      courses: totalCourses,
      latestProfile,
    };
  }, [applicants]);

  const quickTools: QuickTool[] = [
    {
      href: "/applicant",
      icon: "+",
      title: isZh ? "创建新档案" : "Create New Profile",
      description: isZh
        ? "为新的申请方向建立一份全新的匹配档案。"
        : "Start a fresh matching profile for a new application direction.",
      accent: "dark",
    },
    {
      href: "/ai-resume",
      icon: "✦",
      title: isZh ? "AI 简历工作台" : "AI Resume Studio",
      description: isZh
        ? "把简历润色、诊断和导出放在同一个连续流程里。"
        : "Polish, diagnose, and export your resume in one continuous flow.",
      accent: "warm",
    },
    {
      href: "/timeline",
      icon: "◔",
      title: isZh ? "申请时间线" : "Application Timeline",
      description: isZh
        ? "按月份查看接下来该准备什么。"
        : "See what to prepare next, month by month.",
      accent: "soft",
    },
    {
      href: "/budget",
      icon: "£",
      title: isZh ? "预算规划" : "Budget Planner",
      description: isZh
        ? "快速估算留学成本与资金要求。"
        : "Estimate costs and funding requirements quickly.",
      accent: "soft",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f1e8] text-[#16212a]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-20 h-72 w-72 rounded-full bg-[#d7b47b]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#24404e]/12 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between rounded-full border border-white/70 bg-white/70 px-5 py-3 shadow-[0_18px_50px_rgba(23,33,42,0.06)] backdrop-blur">
          <Link
            href="/home"
            className="text-sm text-[#65707a] transition hover:text-[#17232d]"
          >
            {isZh ? "返回主页" : "Back to home"}
          </Link>
          <div className="text-xs uppercase tracking-[0.28em] text-[#8b6638]">
            {isZh ? "学生工作台" : "Student Workspace"}
          </div>
          <Link
            href="/profile"
            className="text-sm text-[#65707a] transition hover:text-[#17232d]"
          >
            {isZh ? "个人设置" : "Profile"}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-[#203644] bg-gradient-to-br from-[#13242f] via-[#1a3340] to-[#8d653b] p-6 text-white shadow-[0_28px_80px_rgba(19,36,47,0.18)] sm:p-8">
            <div className="absolute right-[-6%] top-[-10%] h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute bottom-[-18%] right-[10%] h-48 w-48 rounded-full bg-white/5 blur-2xl" />

            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#efe5d3]">
                <span>Studio</span>
                <span>{isZh ? "申请入口" : "Application Entry"}</span>
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
                {isZh
                  ? "把你的匹配、简历和规划工具集中在一个更顺手的入口页"
                  : "Bring matching, resume work, and planning into one sharper launch space"}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#f0e7da] sm:text-base">
                {isZh
                  ? "先处理主任务，再切换到简历优化、时间线或预算，不再在传统菜单里来回寻找。"
                  : "Start from the main task, then move to resume polishing, timeline planning, or budgeting without bouncing through a traditional menu."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/applicant"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#15242e] transition hover:bg-[#f1e7d5]"
                >
                  {isZh ? "新建申请档案" : "Create a new profile"}
                </Link>
                <Link
                  href="/ai-resume"
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm transition hover:bg-white/15"
                >
                  {isZh ? "打开 AI 简历工作台" : "Open AI Resume Studio"}
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <StatTile
              label={isZh ? "申请档案" : "Profiles"}
              value={stats.profiles}
              note={
                isZh ? "你当前已创建的档案数量" : "Application profiles currently stored"
              }
            />
            <StatTile
              label={isZh ? "匹配结果" : "Matches"}
              value={stats.matches}
              note={
                isZh ? "所有档案累积生成的匹配结果" : "Total evaluation results across profiles"
              }
            />
            <StatTile
              label={isZh ? "课程记录" : "Courses"}
              value={stats.courses}
              note={
                isZh ? "已录入用于匹配的课程数量" : "Courses recorded for matching"
              }
            />
            <div className="rounded-[1.8rem] border border-[#e4d8cb] bg-white/80 p-5 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
              <div className="text-xs uppercase tracking-[0.26em] text-[#8b6638]">
                {isZh ? "最新动态" : "Latest edit"}
              </div>
              <div className="mt-4 text-lg font-semibold text-[#192129]">
                {stats.latestProfile?.full_name ||
                  (isZh ? "还没有档案" : "No profile yet")}
              </div>
              <p className="mt-2 text-sm leading-6 text-[#66707a]">
                {stats.latestProfile
                  ? isZh
                    ? `最近更新于 ${new Date(
                        stats.latestProfile.updated_at
                      ).toLocaleDateString("zh-CN")}`
                    : `Last updated on ${new Date(
                        stats.latestProfile.updated_at
                      ).toLocaleDateString("en-US")}`
                  : isZh
                    ? "创建第一份档案后，这里会显示你的最近进度。"
                    : "This panel will show your latest progress after the first profile is created."}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.28em] text-[#8b6638]">
              {isZh ? "工具入口" : "Tool launchpad"}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-[#1a232b]">
              {isZh ? "围绕申请流程组织，而不是按菜单排列" : "Organized around workflow, not menu order"}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`${toolClasses(
                  tool.accent
                )} group relative overflow-hidden rounded-[1.8rem] border p-6 shadow-[0_18px_50px_rgba(28,36,44,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_58px_rgba(28,36,44,0.12)]`}
              >
                <div className="absolute right-4 top-4 text-xs uppercase tracking-[0.26em] opacity-70">
                  Launch
                </div>
                <div className="text-3xl">{tool.icon}</div>
                <div className="mt-10 text-xl font-semibold">{tool.title}</div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    tool.accent === "soft" ? "text-[#66707a]" : "text-white/84"
                  }`}
                >
                  {tool.description}
                </p>
                <div
                  className={`mt-8 text-sm font-medium ${
                    tool.accent === "soft" ? "text-[#8b6638]" : "text-white"
                  }`}
                >
                  {isZh ? "进入功能" : "Open tool"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-[#8b6638]">
                {isZh ? "档案工作区" : "Profile workspace"}
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-[#1a232b]">
                {isZh ? "你的申请档案集合" : "Your application profiles"}
              </h2>
            </div>
            <Link
              href="/applicant"
              className="rounded-full border border-[#d9cab6] bg-white px-4 py-2 text-sm text-[#7a5a2f] transition hover:bg-[#faf4e8]"
            >
              {isZh ? "创建新档案" : "Add profile"}
            </Link>
          </div>

          {loading && (
            <div className="rounded-[1.8rem] border border-[#e6dbcf] bg-white/70 px-6 py-12 text-center text-sm text-[#6d747b]">
              {t("common.loading")}
            </div>
          )}

          {!loading && applicants.length === 0 && (
            <div className="rounded-[2rem] border border-[#e6dbcf] bg-white/80 p-10 text-center shadow-[0_18px_50px_rgba(23,33,42,0.05)]">
              <div className="text-xs uppercase tracking-[0.28em] text-[#8b6638]">
                {isZh ? "Start" : "Start"}
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-[#192129]">
                {isZh ? "先建立第一份申请档案" : "Create the first profile first"}
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#66707a]">
                {isZh
                  ? "你可以先从一份基础档案开始，后续再为不同方向建立多个版本进行对比。"
                  : "Begin with one base profile, then create additional versions for different application directions and compare them."}
              </p>
              <Link
                href="/applicant"
                className="mt-8 inline-flex rounded-full bg-[#b28a52] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9d7844]"
              >
                {isZh ? "创建第一份档案" : "Create the first profile"}
              </Link>
            </div>
          )}

          {!loading && applicants.length > 0 && (
            <div className="grid gap-5 xl:grid-cols-2">
              {applicants.map((applicant, index) => (
                <article
                  key={applicant.id}
                  className="relative overflow-hidden rounded-[2rem] border border-[#e6dbcf] bg-white/85 p-6 shadow-[0_18px_50px_rgba(23,33,42,0.06)] backdrop-blur"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[2rem] bg-[#f3eadc]" />
                  <div className="relative">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.26em] text-[#8b6638]">
                          {isZh ? `档案 ${index + 1}` : `Profile ${index + 1}`}
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold text-[#192129]">
                          {applicant.full_name ||
                            (isZh ? "未命名档案" : "Untitled profile")}
                        </h3>
                        <p className="mt-2 text-sm text-[#66707a]">
                          {applicant.undergrad_university ||
                            (isZh ? "未填写院校" : "University not set")}
                          {applicant.undergrad_major
                            ? ` · ${applicant.undergrad_major}`
                            : ""}
                        </p>
                      </div>

                      <div className="rounded-full border border-[#eadfce] bg-[#fbf7ef] px-4 py-2 text-xs text-[#7a5a2f]">
                        {new Date(applicant.created_at).toLocaleDateString(
                          isZh ? "zh-CN" : "en-US"
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 text-xs">
                      {applicant.gpa_numeric && (
                        <span className="rounded-full bg-[#f7efe3] px-3 py-1.5 text-[#7a5a2f]">
                          GPA {Number(applicant.gpa_numeric).toFixed(2)}/
                          {Number(applicant.gpa_scale).toFixed(1)}
                        </span>
                      )}
                      {applicant.ielts_overall && (
                        <span className="rounded-full bg-[#f7efe3] px-3 py-1.5 text-[#7a5a2f]">
                          IELTS {Number(applicant.ielts_overall).toFixed(1)}
                        </span>
                      )}
                      {applicant.toefl_total && (
                        <span className="rounded-full bg-[#f7efe3] px-3 py-1.5 text-[#7a5a2f]">
                          TOEFL {applicant.toefl_total}
                        </span>
                      )}
                      {applicant.target_tracks.length > 0 && (
                        <span className="rounded-full bg-[#f1e9de] px-3 py-1.5 text-[#8a633a]">
                          {applicant.target_tracks
                            .map((track) => formatTrackLabel(track))
                            .join(", ")}
                        </span>
                      )}
                      <span className="rounded-full bg-[#eef1f3] px-3 py-1.5 text-[#5c6670]">
                        {applicant.modules.length}{" "}
                        {isZh ? "门课程" : "courses"}
                      </span>
                      <span className="rounded-full bg-[#ece4d7] px-3 py-1.5 text-[#8a633a]">
                        {applicant._count.evaluations}{" "}
                        {isZh ? "个匹配结果" : "matches"}
                      </span>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleSetActive(applicant.id)}
                        className="rounded-full bg-[#17242d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#223542]"
                      >
                        {isZh ? "查看匹配结果" : "View results"}
                      </button>
                      <Link
                        href={`/applicant?editId=${applicant.id}`}
                        className="rounded-full border border-[#d8cec2] px-5 py-3 text-sm text-[#5f6870] transition hover:bg-[#f7f2ea]"
                      >
                        {isZh ? "继续编辑" : "Continue editing"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(applicant.id)}
                        disabled={deletingId === applicant.id}
                        className="rounded-full border border-[#ead5c9] px-5 py-3 text-sm text-[#8f4f3f] transition hover:bg-[#fbf0eb] disabled:opacity-50"
                      >
                        {deletingId === applicant.id
                          ? isZh
                            ? "删除中..."
                            : "Deleting..."
                          : isZh
                            ? "删除"
                            : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-[#e4d8cb] bg-white/80 p-5 shadow-[0_18px_50px_rgba(23,33,42,0.05)] backdrop-blur">
      <div className="text-xs uppercase tracking-[0.26em] text-[#8b6638]">
        {label}
      </div>
      <div className="mt-4 text-4xl font-semibold text-[#192129]">{value}</div>
      <p className="mt-3 text-sm leading-6 text-[#66707a]">{note}</p>
    </div>
  );
}
