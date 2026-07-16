import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Geist is the single typeface across the app: --font-display for headings and
 * figures, --font-body for everything else. Both point at the same family, so
 * pages reading either variable get Geist.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fontVars = {
  "--font-display": "var(--font-geist-sans)",
  "--font-body": "var(--font-geist-sans)",
  "--font-sans": "var(--font-geist-sans)",
} as React.CSSProperties;

export const metadata: Metadata = {
  title: "CareYuk",
  description: "Connecting volunteers with the clinics and communities that need them most.",
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
      style={fontVars}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
