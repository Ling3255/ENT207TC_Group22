"use client";

import { useLocale } from "./LocaleContext";

export default function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { locale, setLocale } = useLocale();

  const isDark = variant === "dark";

  const wrapperClass = isDark
    ? "flex items-center gap-1 rounded-xl border border-white/15 bg-white/[0.06] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
    : "flex items-center gap-1 rounded-xl border border-white/15 bg-white/85 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-md";

  const activeClass = isDark
    ? "bg-white text-slate-950 shadow-sm"
    : "bg-slate-900 text-white shadow-sm";

  const inactiveClass = isDark
    ? "text-white/60 hover:text-white hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  return (
    <div
      className={wrapperClass}
      role="group"
      aria-label="Language selection"
    >
      <button
        onClick={() => setLocale("zh")}
        aria-pressed={locale === "zh"}
        aria-label="Switch to Chinese"
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          locale === "zh" ? activeClass : inactiveClass
        }`}
      >
        ZH
      </button>
      <button
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="Switch to English"
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          locale === "en" ? activeClass : inactiveClass
        }`}
      >
        EN
      </button>
    </div>
  );
}
