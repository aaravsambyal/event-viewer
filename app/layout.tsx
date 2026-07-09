import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Event Viewer",
  description:
    "Event archive and documentation portal.",
  keywords: "events, archive, documentation",
};

import MouseGlow from "@/components/MouseGlow";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-gov-bg font-inter antialiased" suppressHydrationWarning>
        <MouseGlow />
        {children}
      </body>
    </html>
  );
}
