"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import LanguageSwitcher from "@/context/LanguageSwitcher";
import {
  ScrollProgress,
  CustomCursor,
  AnimatedStat,
  MagneticLink,
  TiltCard,
  FeatureCard,
  ParallaxBackground,
  MobileNav,
} from "./components";
import { useTextScramble, useStaggerReveal } from "./hooks";

const showcaseCards = [
  {
    index: "01",
    eyebrowEn: "Programme Matching",
    eyebrowZh: "项目匹配",
    titleEn: "Map your academic background against real UK engineering programmes.",
    titleZh: "把你的学术背景映射到真实的英国工程硕士项目。",
    bodyEn:
      "See grade thresholds, prerequisite modules, language rules, and explanation-ready fit signals in one guided flow.",
    bodyZh:
      "在一条清晰流程里同时看到成绩门槛、先修课、语言要求，以及带解释的匹配信号。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    ),
  },
  {
    index: "02",
    eyebrowEn: "AI Resume Studio",
    eyebrowZh: "AI 简历工作台",
    titleEn: "Turn raw experience into application-ready engineering storytelling.",
    titleZh: "把零散经历整理成适合工程硕士申请的叙事表达。",
    bodyEn:
      "Split, diagnose, rewrite, and finalize your resume with major-specific guidance before syncing it into your profile.",
    bodyZh:
      "先按专业方向拆分、诊断、改写和定稿，再把结果同步回申请档案。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M9.663 17h4.673M12 3v1m0 16v1m-8.364-7.364l.707.707M19.071 4.929l.707.707M4.929 19.071l.707-.707M19.071 19.071l.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
      </svg>
    ),
  },
  {
    index: "03",
    eyebrowEn: "Staff Verification",
    eyebrowZh: "人工审核",
    titleEn: "Keep programme data trustworthy with a high-clarity review workflow.",
    titleZh: "用高可读的审核流程，持续维护可信的项目数据。",
    bodyEn:
      "Create institutions, parse requirements, verify risk points, and keep your programme library accurate over time.",
    bodyZh:
      "新增学校、解析要求、核验风险点，并长期维护专业数据库的准确性。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const flowSteps = [
  {
    step: "01",
    en: "Build your applicant profile with GPA, core modules, language scores, and target tracks.",
    zh: "创建申请档案，录入 GPA、核心课程、语言成绩和目标方向。",
  },
  {
    step: "02",
    en: "Review match bands, prerequisite coverage, risk signals, and official programme links.",
    zh: "查看匹配等级、先修课覆盖度、风险提示和项目官网链接。",
  },
  {
    step: "03",
    en: "Use AI-assisted resume refinement to improve how your story fits the target programme.",
    zh: "用 AI 辅助打磨简历，让你的经历更贴合目标项目。",
  },
  {
    step: "04",
    en: "Let staff verify the underlying data so every recommendation stays auditable and usable.",
    zh: "由工作人员持续审核底层数据，让推荐结果可追踪、可核验、可使用。",
  },
];

const statBlocks = [
  { value: "AI + Rules", en: "Hybrid evaluation engine", zh: "规则与 AI 混合评估" },
  { value: "1 Flow", en: "Research to application in one place", zh: "从检索到申请一体化" },
  { value: "Dual", en: "Student and staff operating surfaces", zh: "学生与管理双端协同" },
];

const signalCards = [
  {
    metric: "87%",
    labelEn: "Example fit signal",
    labelZh: "示例匹配信号",
    bodyEn: "A fast read on how closely an applicant profile aligns with a programme's key constraints.",
    bodyZh: "快速判断申请者背景与项目核心要求的接近程度。",
  },
  {
    metric: "4 Layers",
    labelEn: "Eligibility logic",
    labelZh: "资格判断层",
    bodyEn: "Background, modules, language, and explainability are evaluated together instead of in isolation.",
    bodyZh: "背景、课程、语言与可解释性一起判断，而不是割裂评估。",
  },
  {
    metric: "Live",
    labelEn: "Verified programme data",
    labelZh: "可维护项目数据",
    bodyEn: "Staff workflows help keep programme requirements up to date and reviewable.",
    bodyZh: "工作人员工作流帮助项目要求保持更新且便于复核。",
  },
];

const navIdToLabel = (isEn: boolean) => [
  { href: "#overview", label: isEn ? "Overview" : "概览" },
  { href: "#workflow", label: isEn ? "Capabilities" : "能力" },
  { href: "#system", label: isEn ? "System" : "系统" },
];

interface LandingStats {
  programmeCount: number;
  universityCount: number;
}

export default function LandingPage({ stats }: { stats: LandingStats }) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stepsRef = useStaggerReveal<HTMLDivElement>(".step-item", 100);
  const statsRef = useStaggerReveal<HTMLDivElement>(".stat-item", 120);
  const featuresRef = useStaggerReveal<HTMLElement>(".feature-card", 100);

  const badgeText = useTextScramble(
    isEn ? "UK Engineering Admissions Workspace" : "英国工程硕士申请工作台",
    250,
  );
  const titleLine1 = useTextScramble(isEn ? "Find the Right" : "把复杂申请", 400);
  const titleLine2 = useTextScramble(isEn ? "Engineering" : "变成清晰可见的", 600);
  const titleLine3 = useTextScramble(isEn ? "Next Step" : "下一步判断", 800);

  const navItems = navIdToLabel(isEn);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07111f] text-white">
      <ScrollProgress />
      <CustomCursor />
      <ParallaxBackground />

      <div className="relative z-10">
        <header
          className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-500 ${
            scrolled
              ? "border-white/10 bg-[#07111f]/85 backdrop-blur-xl"
              : "border-transparent bg-transparent"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
            <Link href="/" className="group cursor-hover">
              <div className="text-xs font-medium uppercase tracking-[0.38em] text-cyan-300/90 transition-colors group-hover:text-cyan-200">
                EngiMatch
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/40">
                {isEn ? "Engineering Admissions OS" : "工程硕士申请操作界面"}
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group relative cursor-hover py-1 transition-colors hover:text-white"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 h-px w-0 bg-cyan-300 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <LanguageSwitcher variant="dark" />
              </div>
              <Link
                href="/login"
                className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/75 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white md:inline-flex"
              >
                {isEn ? "Login" : "登录"}
              </Link>
              <div className="hidden md:block">
                <MagneticLink href="/register" primary>
                  {isEn ? "Start Now" : "立即开始"}
                </MagneticLink>
              </div>
              <div className="md:hidden">
                <MobileNav items={navItems} />
              </div>
            </div>
          </div>
        </header>

        <main className="pt-16">
          <section
            id="overview"
            className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-center px-5 py-16 md:px-8"
          >
            <div className="absolute inset-x-0 top-20 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.18),transparent_55%)] blur-3xl" />

            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-200/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              <span className="font-mono">{badgeText}</span>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div>
                <h1 className="max-w-5xl text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.04em] text-white sm:text-[4.25rem] md:text-[5.5rem] lg:text-[6.5rem]">
                  <span className="block">{titleLine1}</span>
                  <span className="block text-transparent [-webkit-text-stroke:1px_rgba(240,249,255,0.35)]">
                    {titleLine2}
                  </span>
                  <span className="block">{titleLine3}</span>
                </h1>

                <p className="mt-7 max-w-2xl text-base leading-[1.8] text-white/60 md:text-lg">
                  {isEn
                    ? "EngiMatch brings programme research, applicant profiling, eligibility checking, resume refinement, and staff verification into one sharper admissions experience."
                    : "EngiMatch 把项目检索、申请者建档、资格判断、简历优化和人工审核整合进同一个更清晰的申请体验里。"}
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <MagneticLink href="/register" primary>
                    {isEn ? "Start Matching" : "开始匹配"}
                  </MagneticLink>
                  <MagneticLink href="/login">
                    {isEn ? "Open Dashboard" : "进入系统"}
                  </MagneticLink>
                </div>

                <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: `${stats.programmeCount}+`,
                      en: "Indexed programmes",
                      zh: "已收录项目",
                    },
                    {
                      value: `${stats.universityCount}`,
                      en: "Universities tracked",
                      zh: "已覆盖院校",
                    },
                    {
                      value: "Explainable",
                      en: "Readable decision signals",
                      zh: "可解释匹配结果",
                    },
                  ].map((item) => (
                    <div
                      key={item.value}
                      className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] px-4 py-4 backdrop-blur-xl"
                    >
                      <div className="text-lg font-semibold text-white">{item.value}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {isEn ? item.en : item.zh}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <TiltCard className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">
                        {isEn ? "Live Surface" : "实时界面"}
                      </div>
                      <div className="mt-1.5 text-lg font-semibold text-white">
                        {isEn ? "Decision Board" : "判断面板"}
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-300/25 bg-emerald-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                      {isEn ? "Ready" : "已就绪"}
                    </div>
                  </div>

                  <div className="grid gap-3 py-4">
                    <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/55 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                            {isEn ? "Fit Signal" : "匹配信号"}
                          </div>
                          <div className="mt-2 text-3xl font-bold text-white">87%</div>
                          <div className="mt-2 text-xs leading-5 text-white/55">
                            {isEn
                              ? "Background and prerequisite coverage are aligned with the selected programme."
                              : "背景与先修课覆盖度和目标项目要求高度接近。"}
                          </div>
                        </div>
                        <div className="relative h-16 w-16">
                          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15.9"
                              fill="none"
                              stroke="url(#fitGrad)"
                              strokeWidth="3"
                              strokeDasharray="87, 100"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="fitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#67e8f9" />
                                <stop offset="100%" stopColor="#fb7185" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
                        <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-rose-400" />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                          {isEn ? "Academic Logic" : "学术判断"}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-white/60">
                          {isEn
                            ? "GPA, modules, degree background, and language readiness evaluated together."
                            : "GPA、课程、专业背景和语言准备度统一判断。"}
                        </div>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                          {isEn ? "Human Verification" : "人工复核"}
                        </div>
                        <div className="mt-2 text-xs leading-5 text-white/60">
                          {isEn
                            ? "Staff review helps keep programme requirements auditable instead of opaque."
                            : "工作人员审核让项目要求保持透明、可核验，而不是黑箱。"}
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>

                <div
                  data-parallax
                  data-px="-10"
                  data-py="8"
                  className="absolute -right-2 top-6 hidden w-48 rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl will-change-transform lg:block"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {isEn ? "Resume AI" : "简历 AI"}
                  </div>
                  <div className="mt-1.5 text-xs leading-5 text-white/75">
                    {isEn ? "Major-specific rewrite and diagnostics" : "按专业方向做改写与诊断"}
                  </div>
                </div>

                <div
                  data-parallax
                  data-px="8"
                  data-py="-10"
                  className="absolute -left-5 bottom-8 hidden w-52 rounded-[1.2rem] border border-white/10 bg-slate-950/60 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl will-change-transform lg:block"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                    {isEn ? "Coverage" : "系统覆盖"}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-white">{stats.programmeCount}+</div>
                  <div className="text-xs text-white/50">
                    {isEn ? "programme entries connected to institutions" : "已连接到院校体系的项目条目"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-white/[0.06] bg-white/[0.015]">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-10 md:gap-x-16 md:px-8">
              <AnimatedStat value={`${stats.programmeCount}+`} label={isEn ? "Programmes" : "项目"} />
              <div className="hidden h-10 w-px bg-white/10 md:block" />
              <AnimatedStat value={`${stats.universityCount}`} label={isEn ? "Universities" : "院校"} />
              <div className="hidden h-10 w-px bg-white/10 md:block" />
              <div className="flex items-center gap-3">
                {["Oxford", "Cambridge", "Imperial", "UCL"].map((name) => (
                  <span
                    key={name}
                    className="cursor-hover rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/55 transition-all duration-300 hover:border-white/25 hover:text-white/80"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-24 md:px-8" id="workflow" ref={featuresRef}>
            <div className="mb-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-rose-300/75">
                  {isEn ? "Capability Stack" : "能力组合"}
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-5xl">
                  {isEn
                    ? "A landing experience that explains the product before the form begins."
                    : "在进入表单之前，就把这个产品为什么有用讲清楚。"}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-white/55">
                {isEn
                  ? "Instead of a static admissions homepage, EngiMatch presents a motion-rich but readable front door with strong information hierarchy."
                  : "它不是普通的招生首页，而是一个有节奏、有层级、同时保持可读性的申请入口。"}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {showcaseCards.map((card) => (
                <FeatureCard key={card.index} card={card} isEn={isEn} />
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {signalCards.map((card) => (
                <div
                  key={card.metric}
                  className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                >
                  <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/70">
                    {isEn ? card.labelEn : card.labelZh}
                  </div>
                  <div className="mt-4 text-3xl font-semibold tracking-tight text-white">{card.metric}</div>
                  <p className="mt-3 text-sm leading-7 text-white/55">
                    {isEn ? card.bodyEn : card.bodyZh}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-5 py-20 md:px-8" id="system">
            <div ref={stepsRef}>
              <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
                  <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-300/70">
                    {isEn ? "System Logic" : "系统逻辑"}
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-4xl">
                    {isEn
                      ? "From raw background data to application confidence."
                      : "从原始背景信息到更有把握的申请判断。"}
                  </h2>
                  <div className="mt-8 space-y-0">
                    {flowSteps.map((item, index) => (
                      <div key={item.step} className="step-item flex gap-4 py-4">
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-xs font-bold text-emerald-300">
                            {item.step}
                          </div>
                          {index < flowSteps.length - 1 && (
                            <div className="mt-2 h-full w-px bg-gradient-to-b from-emerald-300/30 to-transparent" />
                          )}
                        </div>
                        <div className="border-l border-white/[0.06] pl-4">
                          <p className="text-sm leading-7 text-white/62">{isEn ? item.en : item.zh}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div ref={statsRef} className="grid gap-4 md:grid-cols-3">
                    {statBlocks.map((stat) => (
                      <div
                        key={stat.value}
                        className="stat-item rounded-[1.8rem] border border-white/10 bg-slate-950/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-white/20"
                      >
                        <div className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                          {isEn ? "Signal" : "信号"}
                        </div>
                        <div className="mt-5 text-3xl font-bold tracking-tight text-white">{stat.value}</div>
                        <div className="mt-3 text-sm leading-6 text-white/50">{isEn ? stat.en : stat.zh}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-cyan-300/[0.12] via-white/[0.04] to-rose-300/[0.08] p-7">
                      <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                        {isEn ? "Why It Helps" : "它解决什么"}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-3xl">
                        {isEn
                          ? "Students get direction faster, and staff keep the rule base usable."
                          : "学生更快获得方向，工作人员也能把规则库持续维护下去。"}
                      </h3>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                        {isEn
                          ? "That combination matters because admissions tools often fail at one of the two: they either look polished but explain nothing, or they store rules but feel impossible to use."
                          : "这很关键，因为很多申请工具只擅长其中一边: 要么界面好看但解释不清，要么规则很多却难以真正使用。"}
                      </p>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-7">
                      <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">
                        {isEn ? "Enter the System" : "进入系统"}
                      </div>
                      <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">
                        {isEn
                          ? "When you're ready, move from introduction to action."
                          : "准备好之后，就从介绍页进入真正的操作流程。"}
                      </h3>
                      <div className="mt-6 flex flex-col gap-3">
                        <MagneticLink href="/login" primary>
                          {isEn ? "Login" : "登录"}
                        </MagneticLink>
                        <MagneticLink href="/register">
                          {isEn ? "Register" : "注册"}
                        </MagneticLink>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-20 border-t border-white/[0.06] bg-[#07111f]/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 py-12 md:flex-row md:px-8">
            <div className="text-center md:text-left">
              <div className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-300/90">EngiMatch</div>
              <div className="mt-1 text-[11px] text-white/25">
                © {new Date().getFullYear()} EngiMatch. {isEn ? "All rights reserved." : "保留所有权利。"}
              </div>
            </div>
            <div className="flex items-center gap-8 text-xs text-white/35">
              {[
                { label: isEn ? "Privacy" : "隐私", href: "#" },
                { label: isEn ? "Terms" : "条款", href: "#" },
                { label: isEn ? "Contact" : "联系", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group relative cursor-hover transition-colors hover:text-white/70"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-cyan-300/60 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
            <div className="text-[11px] text-white/20">Built with Next.js and Prisma</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
