import type { Metadata } from "next";
import localFont from "next/font/local";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

// Heading font — Ionic MT Std (local)
const ionicMT = localFont({
  src: "../../public/fonts/IonicMTStd-Regular.otf",
  variable: "--font-heading",
  weight: "400",
  display: "swap",
});

// Body font — DM Sans
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kronos — Your AI Calendar",
  description: "An AI-powered calendar that builds your schedule through conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ionicMT.variable} ${dmSans.variable} h-full antialiased`} data-theme="dark">
      <body className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
