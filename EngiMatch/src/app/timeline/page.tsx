"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import {
  buildTimelineRecommendation,
  getGraduationYearOptions,
  getStudyYearLabel,
  TIMELINE_STUDY_YEAR_OPTIONS,
} from "@/lib/timeline-preferences";

type EventSource = "public" | "personal";

interface TimelineEvent {
  id: string;
  title: string;
  title_en: string;
  description: string;
  description_en: string;
  phase: string;
  phase_order: number;
  category: string;
  month_min: number;
  month_max: number;
  is_required: boolean;
  icon: string;
}

interface PersonalTimelineEvent extends TimelineEvent {
  source: "personal";
}

interface DisplayTimelineEvent extends TimelineEvent {
  source: EventSource;
}

interface SessionUser {
  id: string;
  email: string;
  role: string;
  timeline_graduation_year?: number | null;
  timeline_study_year?: number | null;
}

const PHASE_ORDER = [
  "preparation",
  "application",
  "visa",
  "pre_departure",
  "arrival",
] as const;

const PHASE_META: Record<
  string,
  { zh: string; en: string; color: string }
> = {
  preparation: {
    zh: "前期准备",
    en: "Preparation",
    color: "bg-sky-50 border-sky-200 text-sky-700",
  },
  application: {
    zh: "正式申请",
    en: "Application",
    color: "bg-violet-50 border-violet-200 text-violet-700",
  },
  visa: {
    zh: "签证与CAS",
    en: "CAS & Visa",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  pre_departure: {
    zh: "行前准备",
    en: "Pre-Departure",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  arrival: {
    zh: "抵达与注册",
    en: "Arrival",
    color: "bg-rose-50 border-rose-200 text-rose-700",
  },
};

const CATEGORY_META: Record<string, { zh: string; en: string }> = {
  application: { zh: "申请", en: "Application" },
  language: { zh: "语言", en: "Language" },
  document: { zh: "材料", en: "Documents" },
  finance: { zh: "财务", en: "Finance" },
  visa: { zh: "签证", en: "Visa" },
  health: { zh: "健康", en: "Health" },
  accommodation: { zh: "住宿", en: "Accommodation" },
  travel: { zh: "出行", en: "Travel" },
  registration: { zh: "注册", en: "Registration" },
  other: { zh: "其他", en: "Other" },
};

const MONTH_NAMES_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_NAMES_ZH = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function emptyPersonalEvent(): PersonalTimelineEvent {
  return {
    id: "",
    title: "",
    title_en: "",
    description: "",
    description_en: "",
    phase: "preparation",
    phase_order: 1,
    category: "application",
    month_min: 1,
    month_max: 1,
    is_required: false,
    icon: "Task",
    source: "personal",
  };
}

export default function TimelinePage() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  const [publicEvents, setPublicEvents] = useState<TimelineEvent[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedSource, setSelectedSource] = useState<"all" | EventSource>("all");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonalTimelineEvent>(emptyPersonalEvent());
  const [timelineGraduationYear, setTimelineGraduationYear] = useState("");
  const [timelineStudyYear, setTimelineStudyYear] = useState("");
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const personalStorageKey = useMemo(
    () => `engimatch_personal_timeline_${user?.id ?? "guest"}`,
    [user?.id]
  );
  const graduationYearOptions = useMemo(() => getGraduationYearOptions(), []);
  const canShowTimeline = user?.timeline_study_year != null && timelineStudyYear !== "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [timelineResponse, sessionResponse] = await Promise.all([
          fetch("/api/timeline"),
          fetch("/api/auth/session"),
        ]);
        const timelinePayload = await timelineResponse.json().catch(() => null);
        const sessionPayload = await sessionResponse.json().catch(() => null);

        if (cancelled) return;

        setPublicEvents(Array.isArray(timelinePayload?.data) ? timelinePayload.data : []);

        const session = sessionPayload?.data;
        if (session?.authenticated && session.user) {
          const sessionUser = session.user as SessionUser;
          setUser(sessionUser);
          setTimelineGraduationYear(
            sessionUser.timeline_graduation_year
              ? String(sessionUser.timeline_graduation_year)
              : ""
          );
          setTimelineStudyYear(
            sessionUser.timeline_study_year
              ? String(sessionUser.timeline_study_year)
              : ""
          );
        } else {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(personalStorageKey);
    if (!raw) {
      setPersonalEvents([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersonalTimelineEvent[];
      setPersonalEvents(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPersonalEvents([]);
    }
  }, [personalStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(personalStorageKey, JSON.stringify(personalEvents));
  }, [personalEvents, personalStorageKey]);

  const monthLabel = (month: number) =>
    isEnglish ? MONTH_NAMES_EN[month - 1] : MONTH_NAMES_ZH[month - 1];

  const recommendation = useMemo(
    () =>
      buildTimelineRecommendation(
        {
          timeline_graduation_year: timelineGraduationYear
            ? Number(timelineGraduationYear)
            : null,
          timeline_study_year: timelineStudyYear ? Number(timelineStudyYear) : null,
        },
        locale
      ),
    [locale, timelineGraduationYear, timelineStudyYear]
  );

  const mergedEvents = useMemo<DisplayTimelineEvent[]>(
    () => [
      ...publicEvents.map((event) => ({ ...event, source: "public" as const })),
      ...personalEvents,
    ],
    [publicEvents, personalEvents]
  );

  const filteredEvents = useMemo(
    () =>
      mergedEvents.filter((event) => {
        const matchesMonth =
          selectedMonth >= event.month_min && selectedMonth <= event.month_max;
        const matchesPhase =
          selectedPhase === "all" || event.phase === selectedPhase;
        const matchesCategory =
          selectedCategory === "all" || event.category === selectedCategory;
        const matchesSource =
          selectedSource === "all" || event.source === selectedSource;
        return matchesMonth && matchesPhase && matchesCategory && matchesSource;
      }),
    [mergedEvents, selectedMonth, selectedPhase, selectedCategory, selectedSource]
  );

  const groupedByPhase = useMemo(
    () =>
      PHASE_ORDER.reduce<Record<string, DisplayTimelineEvent[]>>((acc, phase) => {
        const items = filteredEvents
          .filter((event) => event.phase === phase)
          .sort((a, b) => {
            if (a.month_min !== b.month_min) return a.month_min - b.month_min;
            if (a.source !== b.source) return a.source === "public" ? -1 : 1;
            return a.title_en.localeCompare(b.title_en);
          });

        if (items.length > 0) {
          acc[phase] = items;
        }
        return acc;
      }, {}),
    [filteredEvents]
  );

  const currentMonthCount = mergedEvents.filter(
    (event) => selectedMonth >= event.month_min && selectedMonth <= event.month_max
  ).length;

  async function saveTimelinePreferences() {
    if (!timelineStudyYear) {
      setPreferenceMessage(
        isEnglish
          ? "Please choose your current university year before viewing the timeline."
          : "请先选择当前大学年级，再查看时间线。"
      );
      return;
    }

    if (!user) {
      setPreferenceMessage(
        isEnglish
          ? "Please log in to save your year to your profile."
          : "请先登录，系统才能把年级保存到你的个人信息中。"
      );
      return;
    }

    setSavingPreferences(true);
    setPreferenceMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timelineGraduationYear: timelineGraduationYear
            ? Number(timelineGraduationYear)
            : null,
          timelineStudyYear: timelineStudyYear ? Number(timelineStudyYear) : null,
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error ||
            (isEnglish
              ? "Failed to save timeline settings."
              : "保存时间线设置失败。")
        );
      }

      setUser((previous) =>
        previous
          ? {
              ...previous,
              timeline_graduation_year: payload?.data?.timeline_graduation_year ?? null,
              timeline_study_year: payload?.data?.timeline_study_year ?? null,
            }
          : previous
      );
      setPreferenceMessage(
        isEnglish ? "Saved to your profile." : "已保存到你的个人资料。"
      );
    } catch (error) {
      setPreferenceMessage(
        error instanceof Error
          ? error.message
          : isEnglish
            ? "Failed to save timeline settings."
            : "保存时间线设置失败。"
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  function openCreateEditor() {
    setEditorMode("create");
    setEditingId(null);
    setForm(emptyPersonalEvent());
    setEditorOpen(true);
  }

  function openEditEditor(event: PersonalTimelineEvent) {
    setEditorMode("edit");
    setEditingId(event.id);
    setForm(event);
    setEditorOpen(true);
  }

  function savePersonalEvent() {
    const titleEn = form.title_en.trim();
    const titleZh = form.title.trim();

    if (!titleEn || !titleZh) return;

    const event: PersonalTimelineEvent = {
      ...form,
      id: editingId ?? `personal_${Date.now()}`,
      title: titleZh,
      title_en: titleEn,
      description: form.description.trim(),
      description_en: form.description_en.trim(),
      phase_order: PHASE_ORDER.indexOf(form.phase as (typeof PHASE_ORDER)[number]) + 1,
      month_min: Math.min(form.month_min, form.month_max),
      month_max: Math.max(form.month_min, form.month_max),
      source: "personal",
      icon: form.icon.trim() || "Task",
    };

    setPersonalEvents((previous) => {
      if (editorMode === "edit" && editingId) {
        return previous.map((item) => (item.id === editingId ? event : item));
      }
      return [...previous, event];
    });

    setEditorOpen(false);
    setEditingId(null);
    setForm(emptyPersonalEvent());
  }

  function deletePersonalEvent(id: string) {
    setPersonalEvents((previous) => previous.filter((event) => event.id !== id));
    if (expandedEvent === id) {
      setExpandedEvent(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/home" className="text-sm text-slate-500 hover:text-slate-800">
            {isEnglish ? "Back to Home" : "返回首页"}
          </Link>
          <div className="text-sm font-medium text-slate-700">
            {isEnglish ? "Application Timeline" : "申请时间线"}
          </div>
          <div className="w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl font-semibold text-slate-900">
            {isEnglish ? "Application Timeline" : "申请时间线"}
          </div>
          <p className="mx-auto max-w-2xl text-slate-500">
            {isEnglish
              ? "View the standard UK application schedule, save your own stage settings, and maintain a personal checklist."
              : "查看英国申请的常见时间安排，保存你自己的阶段设置，并维护个人待办清单。"}
          </p>
        </div>

        {canShowTimeline && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-sky-100">
                  {isEnglish ? "Selected Month" : "当前查看月份"}
                </div>
                <div className="mt-1 text-3xl font-bold">{monthLabel(selectedMonth)}</div>
                <div className="mt-2 text-sm text-sky-100">
                  {currentMonthCount} {isEnglish ? "items in view" : "个相关事项"}
                </div>
              </div>
              <div className="max-w-md rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <div className="text-sm font-medium text-white">{recommendation.title}</div>
                <div className="mt-1 text-sm text-sky-50">{recommendation.description}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-semibold text-slate-900">
                {isEnglish ? "Choose your year first" : "请先选择你的年级"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isEnglish
                  ? "Your current university year is saved to your profile and can be edited later from the profile page."
                  : "当前大学年级会保存到个人信息中，也可以之后在个人信息页修改。"}
              </p>
            </div>
            <Link
              href="/profile"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {isEnglish ? "Open profile page" : "前往个人资料页"}
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {isEnglish ? "Current university year" : "当前大学年级"}
              </label>
              <select
                value={timelineStudyYear}
                onChange={(event) => {
                  setTimelineStudyYear(event.target.value);
                  setPreferenceMessage(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">
                  {isEnglish ? "Select your year" : "请选择年级"}
                </option>
                {TIMELINE_STUDY_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {getStudyYearLabel(year, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {isEnglish ? "Expected graduation year" : "预计毕业年份"}
              </label>
              <select
                value={timelineGraduationYear}
                onChange={(event) => {
                  setTimelineGraduationYear(event.target.value);
                  setPreferenceMessage(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{isEnglish ? "Optional" : "选填"}</option>
                {graduationYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={saveTimelinePreferences}
              disabled={savingPreferences}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPreferences
                ? isEnglish
                  ? "Saving..."
                  : "保存中..."
                : isEnglish
                  ? "Save to profile"
                  : "保存到个人资料"}
            </button>
            <div className="text-sm text-slate-500">
              {user
                ? preferenceMessage ||
                  (isEnglish
                    ? "Your profile and timeline page will share the same settings."
                    : "个人资料页和时间线页会共享同一份设置。")
                : isEnglish
                  ? "Log in to save your stage settings to your profile."
                  : "登录后即可把你的阶段设置保存到个人资料中。"}
            </div>
          </div>
        </div>

        {!canShowTimeline ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <div className="text-lg font-semibold text-slate-900">
              {isEnglish ? "Your timeline is waiting for your year" : "选择年级后再显示申请时间线"}
            </div>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isEnglish
                ? "Choose your current university year above and save it. EngiMatch will store it in your profile, then show the timeline without assuming you are already a junior or senior."
                : "请先在上方选择当前大学年级并保存。EngiMatch 会把年级记录到个人信息中，然后再展示时间线，不会默认你是大三或大四。"}
            </p>
          </div>
        ) : (
          <>
        <div className="mb-6">
          <div className="mb-2 text-xs font-medium text-slate-500">
            {isEnglish ? "Jump to month" : "跳转到月份"}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
              const isCurrent = month === currentMonth;
              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedMonth === month
                      ? "border-slate-900 bg-slate-900 text-white"
                      : isCurrent
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {monthLabel(month)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <FilterGroup
            title={isEnglish ? "Phase" : "阶段"}
            allLabel={isEnglish ? "All phases" : "全部阶段"}
            value={selectedPhase}
            onChange={setSelectedPhase}
            options={PHASE_ORDER.map((phase) => ({
              value: phase,
              label: isEnglish ? PHASE_META[phase].en : PHASE_META[phase].zh,
            }))}
          />
          <FilterGroup
            title={isEnglish ? "Category" : "类别"}
            allLabel={isEnglish ? "All categories" : "全部类别"}
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={Object.keys(CATEGORY_META).map((category) => ({
              value: category,
              label: isEnglish ? CATEGORY_META[category].en : CATEGORY_META[category].zh,
            }))}
          />
          <FilterGroup
            title={isEnglish ? "Source" : "来源"}
            allLabel={isEnglish ? "All items" : "全部项目"}
            value={selectedSource}
            onChange={(value) => setSelectedSource(value as "all" | EventSource)}
            options={[
              { value: "public", label: isEnglish ? "Public timeline" : "公共时间线" },
              { value: "personal", label: isEnglish ? "My timeline" : "我的时间线" },
            ]}
          />
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                {isEnglish ? "Build your own student timeline" : "创建你自己的学生时间线"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                {isEnglish
                  ? "Add custom milestones such as exam dates, portfolio deadlines, scholarship reminders, or personal prep goals."
                  : "你可以添加考试日期、文书截止、奖学金提醒或自己安排的准备任务。"}
              </p>
            </div>
            <button
              onClick={openCreateEditor}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {isEnglish ? "Add personal event" : "添加个人事项"}
            </button>
          </div>

          {editorOpen && (
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
              <EditorField
                label={isEnglish ? "English title" : "英文标题"}
                value={form.title_en}
                onChange={(value) => setForm((previous) => ({ ...previous, title_en: value }))}
              />
              <EditorField
                label={isEnglish ? "Chinese title" : "中文标题"}
                value={form.title}
                onChange={(value) => setForm((previous) => ({ ...previous, title: value }))}
              />
              <EditorArea
                label={isEnglish ? "English description" : "英文说明"}
                value={form.description_en}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, description_en: value }))
                }
              />
              <EditorArea
                label={isEnglish ? "Chinese description" : "中文说明"}
                value={form.description}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, description: value }))
                }
              />
              <SelectField
                label={isEnglish ? "Phase" : "阶段"}
                value={form.phase}
                onChange={(value) => setForm((previous) => ({ ...previous, phase: value }))}
                options={PHASE_ORDER.map((phase) => ({
                  value: phase,
                  label: isEnglish ? PHASE_META[phase].en : PHASE_META[phase].zh,
                }))}
              />
              <SelectField
                label={isEnglish ? "Category" : "类别"}
                value={form.category}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, category: value }))
                }
                options={Object.entries(CATEGORY_META).map(([value, meta]) => ({
                  value,
                  label: isEnglish ? meta.en : meta.zh,
                }))}
              />
              <SelectField
                label={isEnglish ? "Start month" : "开始月份"}
                value={String(form.month_min)}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, month_min: Number(value) }))
                }
                options={Array.from({ length: 12 }, (_, index) => index + 1).map((month) => ({
                  value: String(month),
                  label: monthLabel(month),
                }))}
              />
              <SelectField
                label={isEnglish ? "End month" : "结束月份"}
                value={String(form.month_max)}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, month_max: Number(value) }))
                }
                options={Array.from({ length: 12 }, (_, index) => index + 1).map((month) => ({
                  value: String(month),
                  label: monthLabel(month),
                }))}
              />
              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_required}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        is_required: event.target.checked,
                      }))
                    }
                  />
                  {isEnglish ? "Required item" : "标记为必做事项"}
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={savePersonalEvent}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  {editorMode === "create"
                    ? isEnglish
                      ? "Create"
                      : "创建"
                    : isEnglish
                      ? "Update"
                      : "更新"}
                </button>
                <button
                  onClick={() => {
                    setEditorOpen(false);
                    setEditingId(null);
                    setForm(emptyPersonalEvent());
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {isEnglish ? "Cancel" : "取消"}
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {isEnglish ? "Loading..." : "加载中..."}
          </div>
        ) : Object.keys(groupedByPhase).length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-xl font-semibold text-slate-700">
              {isEnglish ? "No events match the current filters." : "当前筛选条件下没有事项。"}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {isEnglish
                ? "Try another month or create your own milestone."
                : "试试切换月份，或者先添加你自己的时间节点。"}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByPhase).map(([phase, events]) => (
              <section key={phase}>
                <div
                  className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${PHASE_META[phase].color}`}
                >
                  <div className="text-lg font-semibold">
                    {isEnglish ? PHASE_META[phase].en : PHASE_META[phase].zh}
                  </div>
                  <div className="text-xs opacity-70">
                    {events.length} {isEnglish ? "items" : "项"}
                  </div>
                </div>

                <div className="space-y-3">
                  {events.map((event) => {
                    const isOpen = expandedEvent === event.id;
                    const isPast = currentMonth > event.month_max;
                    const isCurrent =
                      currentMonth >= event.month_min && currentMonth <= event.month_max;

                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <button
                          className="w-full px-4 py-4 text-left"
                          onClick={() =>
                            setExpandedEvent(isOpen ? null : event.id)
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 h-3 w-3 rounded-full ${
                                isPast
                                  ? "bg-emerald-500"
                                  : isCurrent
                                    ? "bg-sky-500"
                                    : "bg-slate-300"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <Tag>
                                  {event.source === "public"
                                    ? isEnglish
                                      ? "Public"
                                      : "公共"
                                    : isEnglish
                                      ? "Personal"
                                      : "个人"}
                                </Tag>
                                <Tag>
                                  {isEnglish
                                    ? CATEGORY_META[event.category]?.en ?? event.category
                                    : CATEGORY_META[event.category]?.zh ?? event.category}
                                </Tag>
                                <Tag>
                                  {isPast
                                    ? isEnglish
                                      ? "Done"
                                      : "已完成"
                                    : isCurrent
                                      ? isEnglish
                                        ? "Current"
                                        : "进行中"
                                      : isEnglish
                                        ? "Upcoming"
                                        : "待办"}
                                </Tag>
                                <Tag>
                                  {event.is_required
                                    ? isEnglish
                                      ? "Required"
                                      : "必做"
                                    : isEnglish
                                      ? "Optional"
                                      : "选做"}
                                </Tag>
                              </div>
                              <div className="font-semibold text-slate-900">
                                {isEnglish ? event.title_en : event.title}
                              </div>
                              <div className="mt-1 text-sm text-slate-400">
                                {monthLabel(event.month_min)} - {monthLabel(event.month_max)}
                              </div>
                            </div>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 px-4 pb-4">
                            <p className="pt-4 text-sm leading-6 text-slate-600">
                              {isEnglish ? event.description_en : event.description}
                            </p>

                            {event.source === "personal" && (
                              <div className="mt-4 flex gap-3">
                                <button
                                  onClick={() =>
                                    openEditEditor(event as PersonalTimelineEvent)
                                  }
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  {isEnglish ? "Edit event" : "编辑事项"}
                                </button>
                                <button
                                  onClick={() => deletePersonalEvent(event.id)}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  {isEnglish ? "Delete event" : "删除事项"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 font-semibold text-slate-900">
            {isEnglish ? "12-Month Overview" : "12个月总览"}
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
              const count = mergedEvents.filter(
                (event) => month >= event.month_min && month <= event.month_max
              ).length;
              const isCurrent = month === currentMonth;
              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`aspect-square rounded-lg text-xs font-semibold ${
                    isCurrent
                      ? "bg-slate-900 text-white"
                      : count > 4
                        ? "bg-rose-400 text-white"
                        : count > 2
                          ? "bg-amber-300 text-slate-900"
                          : count > 0
                            ? "bg-sky-100 text-slate-700"
                            : "bg-slate-100 text-slate-400"
                  }`}
                  title={`${monthLabel(month)}: ${count}`}
                >
                  {count > 0 ? count : ""}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {isEnglish
              ? "This overview is a planning aid. Always confirm exact deadlines with your target universities."
              : "这个总览适合作为规划参考，具体截止日期仍请以目标院校官网为准。"}
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  allLabel,
  value,
  onChange,
  options,
}: {
  title: string;
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-500">{title}</div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange("all")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            value === "all"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          {allLabel}
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              value === option.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function EditorArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        className="min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500">
      {children}
    </span>
  );
}
