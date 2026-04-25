"use client";

import { useEffect } from "react";

interface ToastProps {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  onClose: (id: string) => void;
}

export function Toast({ id, message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const styles = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-indigo-500",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white ${styles[type]} transition-all duration-300`}
      role="alert"
    >
      <span className="font-bold text-lg leading-none">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-2 opacity-70 hover:opacity-100 text-sm"
        aria-label="关闭通知"
      >
        ✕
      </button>
    </div>
  );
}
