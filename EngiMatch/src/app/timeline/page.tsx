"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

const PHASE_LABELS: Record<string, { zh: string; en: string; icon: string; color: string }> = {
  preparation: { zh: "准备阶段", en: "Preparation", icon: "📋", color: "bg-blue-50 border-blue-200 text-blue-700" },
  application: { zh: "申请阶段", en: "Application", icon: "📨", color: "bg-violet-50 border-violet-200 text-violet-700" },
  visa: { zh: "CAS 与签证", en: "CAS & Visa", icon: "🛂", color: "bg-amber-50 border-amber-200 text-amber-700" },
  pre_departure: { zh: "出行准备", en: "Pre-Departure", icon: "✈️", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  arrival: { zh: "抵达注册", en: "Arrival & Registration", icon: "🏫", color: "bg-rose-50 border-rose-200 text-rose-700" },
};

const CATEGORY_LABELS: Record<string, { zh: string; en: string; icon: string }> = {
  application: { zh: "申请", en: "Application", icon: "📝" },
  language: { zh: "语言", en: "Language", icon: "🗣️" },
  document: { zh: "材料", en: "Documents", icon: "📁" },
  finance: { zh: "财务", en: "Finance", icon: "💰" },
  visa: { zh: "签证", en: "Visa", icon: "🛂" },
  health: { zh: "健康", en: "Health", icon: "🏥" },
  accommodation: { zh: "住宿", en: "Accommodation", icon: "🏠" },
  travel: { zh: "出行", en: "Travel", icon: "✈️" },
  registration: { zh: "注册", en: "Registration", icon: "🏫" },
  other: { zh: "其他", en: "Other", icon: "📌" },
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_NAMES_ZH = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

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

const PHASE_ORDER = ["preparation", "application", "visa", "pre_departure", "arrival"];

export default function TimelinePage() {
  const { t, locale } = useLocale();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [currentMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isInMonth = (event: TimelineEvent) => {
    return selectedMonth >= event.month_min && selectedMonth <= event.month_max;
  };

  const filteredEvents = events.filter((e) => {
    if (selectedPhase !== "all" && e.phase !== selectedPhase) return false;
    if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
    return true;
  });

  const groupedByPhase = PHASE_ORDER.reduce<Record<string, TimelineEvent[]>>((acc, phase) => {
    const phaseEvents = filteredEvents.filter((e) => e.phase === phase && isInMonth(e));
    if (phaseEvents.length > 0) acc[phase] = phaseEvents;
    return acc;
  }, {});

  const getPhaseProgress = (phase: string): number => {
    const phaseEvents = events.filter((e) => e.phase === phase);
    if (phaseEvents.length === 0) return 0;
    const completed = phaseEvents.filter((e) => currentMonth > e.month_max).length;
    return Math.round((completed / phaseEvents.length) * 100);
  };

  const totalEventsThisMonth = events.filter((e) => isInMonth(e)).length;
  const requiredEventsThisMonth = events.filter((e) => isInMonth(e) && e.is_required).length;

  const catLabel = (c: string) => CATEGORY_LABELS[c]?.[locale] || c;
  const catIcon = (c: string) => CATEGORY_LABELS[c]?.icon || "📌";
  const phLabel = (p: string) => PHASE_LABELS[p]?.[locale] || p;
  const phIcon = (p: string) => PHASE_LABELS[p]?.icon || "";
  const phColor = (p: string) => PHASE_LABELS[p]?.color || "";

  const monthLabel = (m: number) => locale === "en" ? MONTH_NAMES[m - 1] : MONTH_NAMES_ZH[m - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="text-sm text-slate-500 hover:text-slate-800">← {t("nav.home")}</Link>
          <div className="text-sm font-medium text-slate-700">{locale === "en" ? "Application Timeline" : "申请时间线"}</div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📅</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {locale === "en" ? "UK Study Journey Timeline" : "英国留学全程时间线"}
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            {locale === "en"
              ? "From offer acceptance to arrival in the UK — track every key milestone for your September 2026 intake"
              : "从拿到 offer 到抵达英国 — 追踪 2026 年 9 月入学的每个关键节点"}
          </p>
        </div>

        {/* Current month summary */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{monthLabel(selectedMonth)}</div>
              <div className="text-indigo-200 text-sm mt-1">
                {locale === "en"
                  ? `${totalEventsThisMonth} events · ${requiredEventsThisMonth} required`
                  : `共 ${totalEventsThisMonth} 项 · ${requiredEventsThisMonth} 必做`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-indigo-200 mb-1">{locale === "en" ? "Now" : "当前"}</div>
              <div className="text-lg font-semibold">{new Date().toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { month: "long", year: "numeric" })}</div>
            </div>
          </div>
        </div>

        {/* Month selector */}
        <div className="mb-6">
          <div className="text-xs font-medium text-slate-500 mb-2">{locale === "en" ? "Jump to month" : "跳转到月份"}</div>
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Month selection">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
              const isPast = m < currentMonth;
              const isCurrent = m === currentMonth;
              return (
                <button
                  key={m}
                  role="tab"
                  aria-selected={selectedMonth === m}
                  onClick={() => setSelectedMonth(m)}
                  className={`flex-shrink-0 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus:ring-2 focus:ring-indigo-500 ${
                    selectedMonth === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : isCurrent
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                      : isPast
                      ? "bg-slate-50 text-slate-400 border-slate-100"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {monthLabel(m)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {/* Phase filter */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">{locale === "en" ? "Phase" : "阶段"}</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedPhase("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedPhase === "all"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {locale === "en" ? "All Phases" : "全部阶段"}
              </button>
              {PHASE_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                    selectedPhase === p
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>{phIcon(p)}</span>
                  <span>{phLabel(p)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">{locale === "en" ? "Category" : "类别"}</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedCategory === "all"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {locale === "en" ? "All" : "全部"}
              </button>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setSelectedCategory(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                    selectedCategory === k
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>{v.icon}</span>
                  <span>{v[locale]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phase overview cards */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
          {PHASE_ORDER.map((p) => {
            const phaseEvents = events.filter((e) => e.phase === p);
            const progress = getPhaseProgress(p);
            return (
              <button
                key={p}
                onClick={() => setSelectedPhase(selectedPhase === p ? "all" : p)}
                className={`rounded-xl p-2 sm:p-3 text-center border transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                  selectedPhase === p
                    ? "bg-indigo-50 border-indigo-300"
                    : "bg-white border-slate-200 hover:border-indigo-200"
                }`}
                aria-label={`${phLabel(p)}: ${progress}% complete`}
              >
                <div className="text-lg sm:text-xl mb-1">{phIcon(p)}</div>
                <div className="text-xs font-medium text-slate-700 leading-tight hidden sm:block">{phLabel(p)}</div>
                <div className="mt-1 sm:mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{progress}%</div>
              </button>
            );
          })}
        </div>

        {/* Events list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">{t("common.loading")}</div>
        ) : Object.keys(groupedByPhase).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <div className="font-semibold text-slate-600 mb-1">
              {locale === "en" ? "No events for this month" : "本月暂无此类别事件"}
            </div>
            <div className="text-sm text-slate-400">
              {locale === "en" ? "Try a different month or filter" : "试试切换月份或筛选条件"}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByPhase).map(([phase, phaseEvents]) => {
              const pl = PHASE_LABELS[phase];
              return (
                <div key={phase}>
                  {/* Phase header */}
                  <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border ${pl?.color || "bg-slate-50 border-slate-200"}`}>
                    <span className="text-2xl">{pl?.icon}</span>
                    <div>
                      <div className="font-bold text-base">{pl?.[locale] || phase}</div>
                      <div className="text-xs opacity-70">
                        {locale === "en"
                          ? `${phaseEvents.length} event${phaseEvents.length > 1 ? "s" : ""} this month`
                          : `本月 ${phaseEvents.length} 项`}
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-3 pl-4 border-l-2 border-slate-200 ml-4">
                    {phaseEvents.map((event, idx) => {
                      const isOpen = expandedEvent === event.id;
                      const cat = CATEGORY_LABELS[event.category];
                      const isPast = currentMonth > event.month_max;
                      const isCurrent = currentMonth >= event.month_min && currentMonth <= event.month_max;

                      return (
                        <div
                          key={event.id}
                          className={`bg-white rounded-xl border shadow-sm transition-all ${
                            isPast
                              ? "border-slate-200 opacity-70"
                              : isCurrent
                              ? "border-indigo-200 shadow-indigo-100"
                              : "border-slate-200"
                          }`}
                        >
                          <button
                            className="w-full px-4 py-3 flex items-start gap-3 text-left"
                            onClick={() => setExpandedEvent(isOpen ? null : event.id)}
                          >
                            {/* Status dot */}
                            <div className={`mt-1.5 flex-shrink-0 w-3 h-3 rounded-full border-2 ${
                              isPast
                                ? "bg-green-400 border-green-400"
                                : isCurrent
                                ? "bg-indigo-400 border-indigo-400 animate-pulse"
                                : "bg-slate-200 border-slate-300"
                            }`} />

                            {/* Icon */}
                            <span className="text-xl flex-shrink-0 mt-0.5">{event.icon}</span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${
                                  isPast
                                    ? "bg-green-50 text-green-600 border-green-200"
                                    : isCurrent
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                }`}>
                                  {isPast ? (locale === "en" ? "Done" : "已完成") : isCurrent ? (locale === "en" ? "Current" : "进行中") : (locale === "en" ? "Upcoming" : "待办")}
                                </span>
                                {event.is_required && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-red-50 text-red-500 border border-red-200">
                                    {locale === "en" ? "Required" : "必做"}
                                  </span>
                                )}
                                <span className="text-xs text-slate-400">{cat?.icon} {cat?.[locale]}</span>
                              </div>
                              <div className="font-semibold text-slate-800 text-sm leading-snug">
                                {locale === "en" ? event.title_en : event.title}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                {locale === "en"
                                  ? `${MONTH_NAMES[event.month_min - 1]} – ${MONTH_NAMES[event.month_max - 1]}`
                                  : `${MONTH_NAMES_ZH[event.month_min - 1]} – ${MONTH_NAMES_ZH[event.month_max - 1]}`}
                              </div>
                            </div>

                            {/* Expand icon */}
                            <span className="text-slate-400 text-sm flex-shrink-0 mt-1 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                              ▼
                            </span>
                          </button>

                          {/* Expanded content */}
                          {isOpen && (
                            <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {locale === "en" ? event.description_en : event.description}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full year overview */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="font-semibold text-slate-800 mb-4">{locale === "en" ? "12-Month Overview" : "12个月总览"}</div>
          <div className="grid grid-cols-12 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
              const monthEvents = events.filter((e) => m >= e.month_min && m <= e.month_max);
              const requiredCount = monthEvents.filter((e) => e.is_required).length;
              const isCurrentMonth = m === currentMonth;
              const maxCount = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mm) =>
                events.filter((e) => mm >= e.month_min && mm <= e.month_max).length
              ));
              const intensity = maxCount > 0 ? monthEvents.length / maxCount : 0;

              return (
                <div
                  key={m}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                  onClick={() => setSelectedMonth(m)}
                >
                  <div
                    className={`w-full aspect-square rounded-lg transition-all ${
                      isCurrentMonth
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-300"
                        : intensity > 0.7
                        ? "bg-red-400 text-white hover:bg-red-500"
                        : intensity > 0.3
                        ? "bg-amber-400 text-white hover:bg-amber-500"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    title={`${monthLabel(m)}: ${monthEvents.length} events, ${requiredCount} required`}
                  >
                    <div className="flex items-center justify-center h-full text-xs font-bold">
                      {monthEvents.length > 0 ? monthEvents.length : ""}
                    </div>
                  </div>
                  <div className={`text-xs ${isCurrentMonth ? "text-indigo-600 font-bold" : "text-slate-400"}`}>
                    {monthLabel(m)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-slate-100" />
              <span className="text-xs text-slate-400">{locale === "en" ? "None" : "无"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-400" />
              <span className="text-xs text-slate-400">{locale === "en" ? "Some" : "少量"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-400" />
              <span className="text-xs text-slate-400">{locale === "en" ? "Busy" : "繁忙"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-indigo-600" />
              <span className="text-xs text-slate-400">{locale === "en" ? "Current" : "当前月"}</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {locale === "en"
            ? "Based on UKVI requirements and UCAS guidelines for September 2026 intake. Dates are approximate — always check your university's official deadlines."
            : "基于 UKVI 要求和 UCAS 指南，2026 年 9 月入学。日期为参考值，请以各院校官方截止日期为准。"}
        </div>
      </div>
    </div>
  );
}
