"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
        aria-label={isEn ? "Toggle navigation menu" : "切换导航菜单"}
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-white/10 bg-[#050816]/95 backdrop-blur-xl">
          <nav className="flex flex-col px-5 py-4">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-center text-sm text-white/75 transition-all hover:bg-white/10"
              >
                {isEn ? "Login" : "登录"}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-950"
              >
                {isEn ? "Get Started" : "开始体验"}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
