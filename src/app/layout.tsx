import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { assetUrl } from "@/lib/assets";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/*
 * Display face for the wordmark and section headings only. WONK on gives
 * Fraunces its cocked, slightly hand-cut letterforms, which is where the
 * product's personality lives; UI labels stay in Geist.
 */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flashy: printable flashcard PDFs",
  description:
    "Turn a list of cards or a CSV into a double-sided, printable flashcard PDF. Everything runs in your browser.",
  // Next prefixes its own routes and chunks with basePath, but not these, so
  // they need assetUrl() to survive being served from /Flashy.
  icons: {
    icon: [
      { url: assetUrl("/icon.svg"), type: "image/svg+xml" },
      { url: assetUrl("/favicon.ico"), sizes: "32x32" },
    ],
    apple: assetUrl("/apple-icon.png"),
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mx-auto w-full max-w-5xl px-6 pb-10">
          <div className="rule-dashed" />
          <p className="mt-5 text-[0.8125rem] text-ink-soft">
            Made by{" "}
            <a
              href="https://karol.gajda.com"
              className="underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              Karol Gajda
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
