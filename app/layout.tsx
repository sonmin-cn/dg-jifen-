import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "队长积分管理系统",
  description: "内部队长积分、审核、排行与奖金测算系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
