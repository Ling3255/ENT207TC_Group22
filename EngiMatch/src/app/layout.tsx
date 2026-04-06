import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngiMatch - 英国工程硕士申请评估",
  description: "为中国工科本科生评估英国工程硕士项目的适配度",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
