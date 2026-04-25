import type { Metadata } from "next";
import { LocaleProvider } from "@/context/LocaleContext";
import { ToastProvider } from "@/components/ToastProvider";
import LanguageSwitcher from "@/context/LanguageSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngiMatch - UK Engineering Master's Programme Matching",
  description: "Accurately evaluate UK university fit for engineering undergraduates worldwide",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-slate-50 text-slate-900">
        <LocaleProvider>
          <ToastProvider>
            <div className="fixed top-4 right-4 z-50">
              <LanguageSwitcher />
            </div>
            {children}
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
