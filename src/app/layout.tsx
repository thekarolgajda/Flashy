import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { assetUrl } from "@/lib/assets";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { StructuredData } from "@/components/structured-data";

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

/*
 * The title leads with what people actually search for and closes with the
 * brand, because the query is "free flashcard maker printable", not "Flashy".
 * Kept under ~60 characters so Google shows it whole rather than truncating.
 */
/*
 * Scrapers do not run JavaScript and many do not follow relative URLs, so the
 * share image is stated absolutely. It is a committed file rather than a
 * generated route; see scripts/build-og-image.tsx for why.
 */
const OG_IMAGE = {
  url: absoluteUrl("/opengraph-image.png"),
  width: 1200,
  height: 630,
  alt: "Flashy: free printable flashcards, laid out for double-sided printing",
};

const TITLE = "Free Flashcard Maker: Printable Double-Sided PDF | Flashy";
const DESCRIPTION =
  "Make printable flashcards free. Type your cards or upload a CSV and get a double-sided PDF laid out for duplex printing, so every back lands on the right front. No account, no upload: it all runs in your browser.";

export const metadata: Metadata = {
  // Absolute-izes canonical and Open Graph URLs. See src/lib/site.ts for why
  // this is stated rather than derived from basePath.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Karol Gajda", url: "https://karol.gajda.com" }],
  // Self-referencing canonical. Without it, the site is reachable at both
  // /Flashy and /Flashy/ and search engines have to guess which is the page.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    // Lets Google show a full-length description snippet and a large preview
    // image rather than the conservative defaults.
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
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
        <StructuredData />
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
