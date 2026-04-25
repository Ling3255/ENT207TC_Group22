"use client";

import { useLocale } from "./LocaleContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5"
      role="group"
      aria-label="Language selection"
    >
      <button
        onClick={() => setLocale("zh")}
        aria-pressed={locale === "zh"}
        aria-label="Switch to Chinese"
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          locale === "zh"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        ZH
      </button>
      <button
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="Switch to English"
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          locale === "en"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        EN
      </button>
    </div>
  );
}
