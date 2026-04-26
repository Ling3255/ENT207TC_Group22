"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

/* ═══════════════════════════════════════════════════════════════════ */
/*  Data                                                               */
/* ═══════════════════════════════════════════════════════════════════ */

const showcaseCards = [
  {
    index: "01",
    eyebrowEn: "Programme Matching",
    eyebrowZh: "项目智能匹配",
    titleEn: "Map your background against real UK engineering programmes.",
    titleZh: "把你的背景映射到真实英国工科硕士项目。",
    bodyEn:
      "Academic thresholds, language rules, prerequisite modules, and fit explanations are surfaced in one motion-rich flow.",
    bodyZh:
      "学术门槛、语言要求、先修课规则和匹配解释会在一个沉浸式流程里集中呈现。",
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
    eyebrowZh: "AI 简历工作室",
    titleEn: "Turn raw experience into application-ready engineering storytelling.",
    titleZh: "把原始经历打磨成适合工科申请的叙事表达。",
    bodyEn:
      "Split, diagnose, rewrite, and finalize your resume with major-specific guidance before syncing into your profile.",
    bodyZh:
      "先按专业方向拆分、诊断、改写并定稿，再同步回申请档案。",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M9.663 17h4.673M12 3v1m0 16v1m-8.364-7.364l.707.707M19.071 4.929l.707.707M4.929 19.071l.707-.707M19.071 19.071l.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
      </svg>
    ),
  },
  {
    index: "03",
    eyebrowEn: "Staff Verification",
    eyebrowZh: "工作人员审核台",
    titleEn: "Curate universities and programmes with a high-clarity review workflow.",
    titleZh: "用高可读的审核流维护学校与专业数据。",
    bodyEn:
      "Create institutions, parse requirements, verify risks, and keep your programme library trustworthy over time.",
    bodyZh:
      "新增学校、解析要求、核验风险，并长期维护可靠的专业数据库。",
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
    en: "Build your applicant profile with courses, GPA, and target directions.",
    zh: "创建申请档案，录入课程、GPA 和目标方向。",
  },
  {
    step: "02",
    en: "See match bands, module fit, compliance signals, and official programme links.",
    zh: "查看匹配等级、先修课匹配、合规信号与官网链接。",
  },
  {
    step: "03",
    en: "Refine your resume and application narrative with AI-assisted iteration.",
    zh: "用 AI 反复优化简历和申请叙事。",
  },
  {
    step: "04",
    en: "Let staff verify programme data so the system stays accurate and usable.",
    zh: "让工作人员持续审核项目数据，保证系统长期可用。",
  },
];

const statBlocks = [
  { value: "316+", en: "Engineering programmes indexed", zh: "个工科项目已收录" },
  { value: "11", en: "Russell Group universities", zh: "所罗素集团大学" },
  { value: "AI + Rules", en: "Hybrid matching engine", zh: "规则与 AI 混合引擎" },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                              */
/* ═══════════════════════════════════════════════════════════════════ */

interface LandingStats {
  programmeCount: number;
  universityCount: number;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Text Scramble Hook                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

function useTextScramble(text: string, delay = 0) {
  const [display, setDisplay] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    const totalFrames = text.length * 4;
    let frame = 0;

    const timeout = setTimeout(() => {
      hasRun.current = true;
      const tick = () => {
        frame++;
        const revealCount = Math.floor((frame / totalFrames) * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " " || text[i] === "\n" || text[i] === "\r") {
            out += text[i];
          } else if (i < revealCount) {
            out += text[i];
          } else if (i < revealCount + 3) {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            out += "\u00A0";
          }
        }
        setDisplay(out);
        if (frame < totalFrames) requestAnimationFrame(tick);
        else setDisplay(text);
      };
      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return display;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Count-up Animation                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1500, delay = 0) {
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasRun.current) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        hasRun.current = true;
        io.unobserve(el);
        setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }, delay);
      }
    }, { threshold: 0.3 });

    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, delay]);

  return { ref, value };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Stagger Reveal via IntersectionObserver                            */
/* ═══════════════════════════════════════════════════════════════════ */

function useStaggerReveal<T extends HTMLElement>(itemSelector: string, staggerMs = 80) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>(itemSelector);
    items.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(24px)";
      item.style.transition = `opacity 0.6s ease, transform 0.6s ease`;
    });

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        items.forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
          }, i * staggerMs);
        });
        io.unobserve(container);
      }
    }, { threshold: 0.1 });

    io.observe(container);
    return () => io.disconnect();
  }, [itemSelector, staggerMs]);

  return containerRef;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Scroll Progress Bar                                                */
/* ═══════════════════════════════════════════════════════════════════ */

function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const top = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      setProgress(height > 0 ? (top / height) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[60] h-[2px] w-full bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
        style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Custom Cursor                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x - 3}px, ${target.current.y - 3}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x - (hovering ? 24 : 16)}px, ${pos.current.y - (hovering ? 24 : 16)}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button'], input, textarea, select, label, .cursor-hover")) {
        setHovering(true);
      }
    };
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role='button'], input, textarea, select, label, .cursor-hover")) {
        setHovering(false);
      }
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, [hovering]);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[6px] w-[6px] rounded-full bg-white mix-blend-difference will-change-transform"
        style={{ transition: "width 0.2s, height 0.2s" }}
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-white/60 mix-blend-difference will-change-transform transition-all duration-300 ${
          hovering ? "h-12 w-12 border-white/30 bg-white/5" : "h-8 w-8"
        }`}
      />
      <style>{`@media (pointer: coarse) { .cursor-dot, .cursor-ring { display:none !important; } }`}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Animated Stat Number                                               */
/* ═══════════════════════════════════════════════════════════════════ */

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const numeric = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const suffix = value.replace(/[\d]/g, "");
  const { ref, value: animated } = useCountUp(numeric, 1800);

  return (
    <div className="flex flex-col items-center text-center">
      <span ref={ref} className="text-4xl font-bold tracking-tight text-white md:text-5xl">
        {animated}{suffix}
      </span>
      <span className="mt-2 text-sm text-white/50">{label}</span>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Component                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export default function LandingPage({ stats }: { stats: LandingStats }) {
  const { locale } = useLocale();
  const isEn = locale === "en";

  /* ── Header scroll background ───────────────────────────────────── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Parallax background (rAF, no React state) ──────────────────── */
  const heroBgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = heroBgRef.current;
    if (!container) return;
    const layers = container.querySelectorAll<HTMLElement>("[data-parallax]");
    let raf = 0;
    let tx = 0, ty = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        layers.forEach((layer) => {
          const fx = Number(layer.dataset.px || 0);
          const fy = Number(layer.dataset.py || 0);
          layer.style.transform = `translate(${tx * fx}px, ${ty * fy}px)`;
        });
        raf = 0;
      });
    };

    window.addEventListener("pointermove", onMove);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);

  /* ── Global mouse spotlight on background ───────────────────────── */
  const bgSpotlightRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bgSpotlightRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(34,211,238,0.07), transparent 40%)`;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /* ── Stagger refs ───────────────────────────────────────────────── */
  const stepsRef = useStaggerReveal<HTMLDivElement>(".step-item", 100);
  const statsRef = useStaggerReveal<HTMLDivElement>(".stat-item", 120);

  /* ── Hero scramble texts ────────────────────────────────────────── */
  const badgeText = useTextScramble(isEn ? "Immersive UK Engineering Admissions" : "沉浸式英国工科申请平台", 300);
  const titleLine1 = useTextScramble(isEn ? "Engineer" : "为你的", 500);
  const titleLine2 = useTextScramble(isEn ? "Your Next" : "工科申请", 700);
  const titleLine3 = useTextScramble(isEn ? "Move" : "做决策", 900);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <ScrollProgress />
      <CustomCursor />

      {/* ── Background layers ──────────────────────────────────────── */}
      <div ref={heroBgRef} className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          data-parallax data-px="28" data-py="22"
          className="absolute left-[-10%] top-[-10%] h-[38rem] w-[38rem] rounded-full bg-cyan-400/10 blur-3xl will-change-transform"
        />
        <div
          data-parallax data-px="-24" data-py="-16"
          className="absolute right-[-8%] top-[12%] h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/08 blur-3xl will-change-transform"
        />
        <div
          data-parallax data-px="18" data-py="-20"
          className="absolute bottom-[-12%] left-[20%] h-[28rem] w-[28rem] rounded-full bg-emerald-400/08 blur-3xl will-change-transform"
        />
        {/* Global mouse spotlight */}
        <div ref={bgSpotlightRef} className="absolute inset-0 transition-[background] duration-100" />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_45%),linear-gradient(180deg,rgba(7,10,24,0.25),rgba(5,8,22,0.97))]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:80px_80px]" />
      </div>

      <div className="relative z-10">
        {/* ═════════════════════════════════════════════════════════════ */}
        {/*  Header                                                     */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <header
          className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-500 ${
            scrolled
              ? "border-white/15 bg-[#050816]/85 backdrop-blur-xl"
              : "border-transparent bg-transparent"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
            <Link href="/" className="group cursor-hover">
              <div className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-300/90 transition-colors group-hover:text-cyan-300">
                EngiMatch
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/35">
                {isEn ? "Engineering Admissions" : "工程硕士申请体验"}
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
              {[
                { href: "#overview", label: isEn ? "Overview" : "总览" },
                { href: "#workflow", label: isEn ? "Features" : "功能" },
                { href: "#system", label: isEn ? "System" : "系统" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="group relative py-1 transition-colors hover:text-white cursor-hover"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-300 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="cursor-hover rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/75 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              >
                {isEn ? "Login" : "登录"}
              </Link>
              <MagneticLink href="/register" primary>
                {isEn ? "Get Started" : "开始体验"}
              </MagneticLink>
            </div>
          </div>
        </header>

        <main className="pt-16">
          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  Hero                                                       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section
            id="overview"
            className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-center px-5 py-16 md:px-8"
          >
            <div>
              {/* Badge with scramble */}
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-200/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                </span>
                <span className="font-mono">{badgeText}</span>
              </div>

              <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                <div>
                  {/* Scrambled title */}
                  <h1 className="max-w-5xl text-[2.8rem] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[4rem] md:text-[5.5rem] lg:text-[6.5rem]">
                    <span className="block">{titleLine1}</span>
                    <span className="block text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.3)]">{titleLine2}</span>
                    <span className="block">{titleLine3}</span>
                  </h1>

                  <p className="mt-7 max-w-2xl text-base leading-[1.75] text-white/55 md:text-lg">
                    {isEn
                      ? "EngiMatch turns programme research, applicant profiling, resume optimization, and staff verification into one cinematic workflow. A high-clarity, high-feedback admissions interface."
                      : "EngiMatch 将专业检索、申请者建档、简历优化和工作人员审核融为一体。这不是普通表单站，而是一个高反馈、高辨识度的申请体验入口。"}
                  </p>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <MagneticLink href="/register" primary>
                      {isEn ? "Start Matching" : "开始匹配"} →
                    </MagneticLink>
                    <MagneticLink href="/login">
                      {isEn ? "Login to Dashboard" : "进入登录页"}
                    </MagneticLink>
                  </div>
                </div>

                {/* Live surface card */}
                <div className="relative">
                  <TiltCard className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Live Surface</div>
                        <div className="mt-1.5 text-lg font-semibold text-white">{isEn ? "Decision Board" : "决策面板"}</div>
                      </div>
                      <div className="rounded-full border border-emerald-300/25 bg-emerald-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                        Active
                      </div>
                    </div>

                    <div className="grid gap-3 py-4">
                      <div className="rounded-[1.2rem] border border-white/10 bg-slate-950/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.25em] text-white/30">{isEn ? "Fit Signal" : "匹配信号"}</div>
                            <div className="mt-1 text-3xl font-bold text-white">87%</div>
                          </div>
                          <div className="relative h-14 w-14">
                            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#fitGrad)" strokeWidth="3" strokeDasharray="87, 100" strokeLinecap="round" />
                              <defs>
                                <linearGradient id="fitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#67e8f9" />
                                  <stop offset="100%" stopColor="#e879f9" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400" />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{isEn ? "Academic" : "学术准备"}</div>
                          <div className="mt-2 text-xs leading-5 text-white/60">{isEn ? "GPA, modules & language checks unified." : "GPA、课程与语言门槛统一评估。"}</div>
                        </div>
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{isEn ? "Verification" : "人工核验"}</div>
                          <div className="mt-2 text-xs leading-5 text-white/60">{isEn ? "Staff review keeps rules auditable." : "工作人员审核保证规则可核验。"}</div>
                        </div>
                      </div>
                    </div>
                  </TiltCard>

                  {/* Floating badge — resume AI */}
                  <div
                    data-parallax data-px="-10" data-py="8"
                    className="absolute -right-2 top-6 hidden w-44 rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl will-change-transform lg:block"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">{isEn ? "Resume AI" : "简历 AI"}</div>
                    <div className="mt-1.5 text-xs leading-5 text-white/75">{isEn ? "Major-specific rewrite + diagnosis" : "按专业方向诊断与改写"}</div>
                  </div>

                  {/* Floating badge — programme count */}
                  <div
                    data-parallax data-px="8" data-py="-10"
                    className="absolute -left-5 bottom-8 hidden w-48 rounded-[1.2rem] border border-white/10 bg-slate-950/60 p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl will-change-transform lg:block"
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">{isEn ? "Indexed" : "已收录"}</div>
                    <div className="mt-1 text-2xl font-bold text-white">{stats.programmeCount}</div>
                    <div className="text-xs text-white/50">{isEn ? "programmes across institutions" : "个项目已跨校收录"}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  Trust bar                                                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="border-y border-white/[0.06] bg-white/[0.015]">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-10 md:gap-x-16 md:px-8">
              <AnimatedStat value={`${stats.programmeCount}+`} label={isEn ? "Programmes" : "个项目"} />
              <div className="hidden h-10 w-px bg-white/10 md:block" />
              <AnimatedStat value={`${stats.universityCount}`} label={isEn ? "Universities" : "所大学"} />
              <div className="hidden h-10 w-px bg-white/10 md:block" />
              <div className="flex items-center gap-3">
                {["Oxford", "Cambridge", "Imperial", "UCL"].map((name) => (
                  <span
                    key={name}
                    className="cursor-hover rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/50 transition-all duration-300 hover:border-white/25 hover:text-white/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  Showcase cards                                             */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="mx-auto max-w-7xl px-5 py-24 md:px-8" id="workflow" ref={useStaggerReveal<HTMLElement>(".feature-card", 100)}>
            <div className="mb-14 text-center md:text-left">
              <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-fuchsia-300/70">
                {isEn ? "Narrative Workflow" : "叙事化流程"}
              </div>
              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:mx-0 md:text-5xl">
                {isEn ? "A front door that feels like a product reveal." : "像产品发布一样展开的第一印象。"}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50 md:mx-0">
                {isEn
                  ? "Inspired by dark, kinetic portfolio experiences, translated into an admissions context."
                  : "参考深色、高动势的作品展示站气质，翻译成一个真正能说明平台价值的申请入口。"}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {showcaseCards.map((card) => (
                <FeatureCard key={card.index} card={card} isEn={isEn} />
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/*  System logic                                               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <section className="mx-auto max-w-7xl px-5 py-20 md:px-8" id="system">
            <div ref={stepsRef}>
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                {/* Left — flow steps */}
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
                  <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-300/70">
                    {isEn ? "System Logic" : "系统逻辑"}
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-4xl">
                    {isEn ? "From raw background to application confidence." : "从原始背景信息到可执行申请判断。"}
                  </h2>
                  <div className="mt-8 space-y-0">
                    {flowSteps.map((item, i) => (
                      <div key={item.step} className="step-item flex gap-4 py-4">
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-xs font-bold text-emerald-300">
                            {item.step}
                          </div>
                          {i < flowSteps.length - 1 && (
                            <div className="mt-2 h-full w-px bg-gradient-to-b from-emerald-300/30 to-transparent" />
                          )}
                        </div>
                        <div className="border-l border-white/[0.06] pl-4">
                          <p className="text-sm leading-7 text-white/60">{isEn ? item.en : item.zh}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — stats + CTA */}
                <div className="flex flex-col gap-6">
                  <div ref={statsRef} className="grid gap-4 md:grid-cols-3">
                    {statBlocks.map((stat) => (
                      <div
                        key={stat.value}
                        className="stat-item rounded-[1.8rem] border border-white/10 bg-slate-950/40 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
                      >
                        <div className="text-[10px] uppercase tracking-[0.25em] text-white/30">Signal</div>
                        <div className="mt-5 text-3xl font-bold tracking-tight text-white">{stat.value}</div>
                        <div className="mt-3 text-sm leading-6 text-white/50">{isEn ? stat.en : stat.zh}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-cyan-300/[0.06] p-7">
                    <div className="flex h-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
                      <div className="max-w-2xl">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">
                          {isEn ? "Ready to Enter" : "准备进入系统"}
                        </div>
                        <h3 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white md:text-4xl">
                          {isEn
                            ? "Login when ready. Experience starts before the form."
                            : "准备好后再登录。体验应该先于表单开始。"}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
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

        {/* ═════════════════════════════════════════════════════════════ */}
        {/*  Footer                                                     */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <footer className="mt-20 border-t border-white/[0.06] bg-[#050816]/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 py-12 md:flex-row md:px-8">
            <div className="text-center md:text-left">
              <div className="text-xs font-medium uppercase tracking-[0.35em] text-cyan-300/90">EngiMatch</div>
              <div className="mt-1 text-[11px] text-white/25">
                © {new Date().getFullYear()} EngiMatch. {isEn ? "All rights reserved." : "保留所有权利。"}
              </div>
            </div>
            <div className="flex items-center gap-8 text-xs text-white/35">
              {[
                { label: isEn ? "Privacy" : "隐私政策", href: "#" },
                { label: isEn ? "Terms" : "使用条款", href: "#" },
                { label: isEn ? "Contact" : "联系我们", href: "#" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="group relative transition-colors hover:text-white/70 cursor-hover"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-cyan-300/60 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
            <div className="text-[11px] text-white/20">Built with Next.js & Prisma</div>
          </div>
        </footer>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function MagneticLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);

  /* Magnetic effect */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    };
    const onLeave = () => {
      el.style.transform = "translate(0,0)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  /* Click ripple */
  const onClick = (e: React.MouseEvent) => {
    const el = ref.current;
    const ripple = rippleRef.current;
    if (!el || !ripple) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.transform = "translate(-50%, -50%) scale(0)";
    ripple.style.opacity = "0.4";
    requestAnimationFrame(() => {
      ripple.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
      ripple.style.transform = "translate(-50%, -50%) scale(4)";
      ripple.style.opacity = "0";
    });
    setTimeout(() => {
      ripple.style.transition = "none";
      ripple.style.transform = "translate(-50%, -50%) scale(0)";
    }, 500);
  };

  if (primary) {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-shadow hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] cursor-hover"
      >
        <span className="relative z-10">{children}</span>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyan-200 via-white to-fuchsia-200 transition-transform duration-500 group-hover:translate-x-0" />
        <span ref={rippleRef} className="pointer-events-none absolute h-20 w-20 rounded-full bg-white/30" style={{ transform: "translate(-50%, -50%) scale(0)" }} />
      </Link>
    );
  }

  return (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      className="relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm uppercase tracking-[0.18em] text-white/75 transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.06)] cursor-hover"
    >
      <span className="relative z-10">{children}</span>
      <span ref={rippleRef} className="pointer-events-none absolute h-20 w-20 rounded-full bg-white/20" style={{ transform: "translate(-50%, -50%) scale(0)" }} />
    </Link>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={`transition-transform duration-200 ease-out will-change-transform ${className}`}>
      {children}
    </div>
  );
}

function FeatureCard({ card, isEn }: { card: typeof showcaseCards[0]; isEn: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--spotlight-x", `${x}px`);
      el.style.setProperty("--spotlight-y", `${y}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <article
      ref={cardRef}
      className="feature-card group relative cursor-hover overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
      style={{
        background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(34,211,238,0.07), transparent 40%)`,
      }}
    >
      {/* Glow border on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[1.8rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(103,232,249,0.15), transparent 50%)`,
        }}
      />
      {/* Animated gradient border */}
      <div className="pointer-events-none absolute -inset-[1px] rounded-[1.82rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, rgba(103,232,249,0.3) 0deg, rgba(232,121,249,0.3) 120deg, rgba(52,211,153,0.3) 240deg, rgba(103,232,249,0.3) 360deg)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/30">{card.index}</div>
          <div className="rounded-full border border-white/10 bg-white/[0.05] p-2.5 text-cyan-300/70 transition-all duration-300 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/10 group-hover:text-cyan-300 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            {card.icon}
          </div>
        </div>
        <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-300/70">
          {isEn ? card.eyebrowEn : card.eyebrowZh}
        </div>
        <h3 className="mt-3 text-xl font-semibold leading-snug tracking-[-0.01em] text-white">
          {isEn ? card.titleEn : card.titleZh}
        </h3>
        <p className="mt-4 text-sm leading-7 text-white/55">{isEn ? card.bodyEn : card.bodyZh}</p>
      </div>
    </article>
  );
}
