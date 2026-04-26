"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import zhDict from "./dict.zh";
import enDict from "./dict.en";

export type Locale = "zh" | "en";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

// Static dictionaries to avoid async loading issues
const dictionaries: Record<Locale, Record<string, string>> = {
  zh: zhDict,
  en: enDict,
};

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    document.title =
      locale === "en"
        ? "EngiMatch - UK Engineering Master's Programme Matching"
        : "EngiMatch - 英国工程硕士项目智能匹配";
  }, [locale]);

  useEffect(() => {
    const stored = localStorage.getItem("engimatch_locale") as Locale;
    if (stored === "zh" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (loc: Locale) => {
    setIsLoading(true);
    setLocaleState(loc);
    localStorage.setItem("engimatch_locale", loc);
    // Small delay to ensure state is properly updated before UI re-renders
    setTimeout(() => setIsLoading(false), 50);
  };

  const t = (key: string): string => {
    const dict = dictionaries[locale];
    return dict[key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isLoading }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
