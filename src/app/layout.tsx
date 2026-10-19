import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { companyPlaceholderConfig } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${companyPlaceholderConfig.companyName} | ${companyPlaceholderConfig.platformTitle}`,
    template: `%s | ${companyPlaceholderConfig.companyName}`,
  },
  description: companyPlaceholderConfig.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
