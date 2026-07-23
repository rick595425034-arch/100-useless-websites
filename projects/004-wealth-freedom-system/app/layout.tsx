import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "财富自由实现系统 · AUREUS",
    description: "基于全球流动性网络，为您的资产解除一切不必要的限制。",
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "财富自由实现系统 · AUREUS",
      description: "基于全球流动性网络，为您的资产解除一切不必要的限制。",
      siteName: "AUREUS",
      locale: "zh_CN",
      type: "website",
      images: [{ url: socialImage, width: 1675, height: 941, alt: "财富自由实现系统" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "财富自由实现系统 · AUREUS",
      description: "基于全球流动性网络，为您的资产解除一切不必要的限制。",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
