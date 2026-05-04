"use client";

import { useEffect } from "react";
import { useLocale } from "@/context/LocaleContext";

interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  onClose: (id: string) => void;
}

export function Toast({
  id,
  message,
  type = "info",
  onClose,
}: ToastProps) {
  const { locale } = useLocale();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [id, onClose]);

  const toneClasses = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-sky-500",
  };

  const toneLabels = {
    success: "OK",
    error: "!",
    info: "i",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg ${toneClasses[type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-base font-bold leading-none">
        {toneLabels[type]}
      </span>
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="ml-2 text-sm opacity-75 transition hover:opacity-100"
        aria-label={locale === "en" ? "Close notification" : "关闭通知"}
      >
        x
      </button>
    </div>
  );
}
