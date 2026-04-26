import type { Metadata } from "next";
import { LocaleProvider } from "@/context/LocaleContext";
import { ToastProvider } from "@/components/ToastProvider";
import GlobalLanguageSwitcher from "@/components/GlobalLanguageSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngiMatch - 英国工程硕士项目智能匹配",
  description: "为工程类本科生提供英国院校与硕士项目匹配、简历优化与申请支持",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 text-slate-900" suppressHydrationWarning>
        <LocaleProvider>
          <ToastProvider>
            <GlobalLanguageSwitcher />
            {children}
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
