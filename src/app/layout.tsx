import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortress — AI Calendar Builder",
  description:
    "Describe your schedule. Fortress builds it. Turn a plain-language description into a structured, editable calendar in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fafafa]">{children}</body>
    </html>
  );
}
